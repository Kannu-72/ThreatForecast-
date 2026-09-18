from collections import deque
import asyncio
import time

from ..model import ModelRuntime
from ..state_engine import StateEngine
from ..config import HORIZONS


class Runtime:

    def __init__(self):

        self.model = ModelRuntime()
        self.engine = StateEngine()

        self.history = deque(
            maxlen=200
        )

        self.subs = set()

        self.mode = "stopped"
        self.capture = None
        self.replay = None
        self.interface = ""

        # ====================================================
        # PACKET STREAM
        # ====================================================

        self.packet_counter = 0
        self.packet_display = True

        # Keep only recent packet metadata in memory
        self.packet_history = deque(
            maxlen=200
        )

    # ========================================================
    # STARTUP
    # ========================================================

    async def startup(self):

        self.model.load()

    # ========================================================
    # BROADCAST
    # ========================================================

    async def _broadcast(self, item):

        for q in list(self.subs):

            try:

                q.put_nowait(
                    item
                )

            except asyncio.QueueFull:

                pass

    # ========================================================
    # FORECAST EMISSION
    # ========================================================

    async def emit(self, state):

        x = self.engine.matrix()

        # Five complete states are required
        if x is None:

            return None

        y = self.model.predict(x)

        flags = (
            y >= self.model.threshold
        )

        idx = int(
            y.argmax()
        )

        item = {
            "event_type":
                "forecast",

            "timestamp":
                state["end_ts"],

            "mode":
                self.mode,

            "risk_scores": [
                float(v)
                for v in y
            ],

            "warning":
                bool(flags.any()),

            "warning_horizons_seconds": [
                HORIZONS[i]
                for i, flag in enumerate(flags)
                if flag
            ],

            "peak_risk":
                float(y[idx]),

            "peak_risk_horizon_seconds":
                HORIZONS[idx],

            "threshold":
                self.model.threshold,

            "state_count":
                self.engine.total,

            "packets_in_latest_state":
                state["packet_count"],

            "latest_state": {
                "start_ts":
                    state["start_ts"],

                "end_ts":
                    state["end_ts"],

                "packet_count":
                    state["packet_count"],

                "features":
                    state["features"].tolist(),
            },
        }

        self.history.append(
            item
        )

        # Terminal state summary
        self._print_state_summary(
            state,
            y
        )

        # Send forecast to frontend
        await self._broadcast(
            item
        )

        return item

    # ========================================================
    # PACKET EVENT
    # ========================================================

    async def _emit_packet(
        self,
        pkt,
        packet_record
    ):

        self.packet_counter += 1

        # ----------------------------------------------------
        # Packet fields
        # ----------------------------------------------------

        timestamp = getattr(
            pkt,
            "time",
            None
        )

        if timestamp is None:

            timestamp = time.time()

        timestamp = float(
            timestamp
        )

        src_ip = (
            packet_record.src_ip
            or "-"
        )

        dst_ip = (
            packet_record.dst_ip
            or "-"
        )

        protocol = (
            packet_record.protocol
            or "OTHER"
        )

        packet_length = (
            packet_record.packet_length
        )

        src_port = (
            packet_record.src_port
        )

        dst_port = (
            packet_record.dst_port
        )

        tcp_flags = (
            packet_record.tcp_flags
        )

        # ----------------------------------------------------
        # Display endpoints
        # ----------------------------------------------------

        if src_port is not None:

            source = (
                f"{src_ip}:{src_port}"
            )

        else:

            source = str(
                src_ip
            )

        if dst_port is not None:

            destination = (
                f"{dst_ip}:{dst_port}"
            )

        else:

            destination = str(
                dst_ip
            )

        # ----------------------------------------------------
        # Packet size
        # ----------------------------------------------------

        if packet_length is not None:

            packet_size = int(
                float(packet_length)
            )

        else:

            packet_size = 0

        # ----------------------------------------------------
        # Terminal display
        # ----------------------------------------------------

        if self.packet_display:

            try:

                time_text = time.strftime(
                    "%H:%M:%S",
                    time.localtime(
                        timestamp
                    )
                )

            except Exception:

                time_text = "--:--:--"

            flags_text = ""

            if tcp_flags:

                flags_text = (
                    f" | Flags={tcp_flags}"
                )

            print(
                f"[PACKET "
                f"{self.packet_counter:08d}] "
                f"{time_text} | "
                f"{source} -> "
                f"{destination} | "
                f"{protocol} | "
                f"{packet_size} bytes"
                f"{flags_text}",
                flush=True
            )

        # ----------------------------------------------------
        # Frontend packet event
        # ----------------------------------------------------

        item = {

            "event_type":
                "packet",

            "timestamp":
                timestamp,

            "mode":
                self.mode,

            "packet_id":
                self.packet_counter,

            "src_ip":
                str(src_ip),

            "dst_ip":
                str(dst_ip),

            "src_port":
                (
                    int(src_port)
                    if src_port is not None
                    else None
                ),

            "dst_port":
                (
                    int(dst_port)
                    if dst_port is not None
                    else None
                ),

            "protocol":
                str(protocol),

            "packet_length":
                packet_size,

            "tcp_flags":
                (
                    str(tcp_flags)
                    if tcp_flags
                    else None
                ),

            "source":
                source,

            "destination":
                destination,

            "summary":
                self._packet_summary(pkt),
        }

        # ----------------------------------------------------
        # Keep short packet history
        # ----------------------------------------------------

        self.packet_history.append(
            item
        )

        # ----------------------------------------------------
        # Send packet to frontend
        # ----------------------------------------------------

        await self._broadcast(
            item
        )

        return item

    # ========================================================
    # PACKET SUMMARY
    # ========================================================

    def _packet_summary(self, pkt):

        try:

            return pkt.summary()

        except Exception:

            return ""

    # ========================================================
    # PRINT 10-SECOND STATE
    # ========================================================

    def _print_state_summary(
        self,
        state,
        forecast
    ):

        print()

        print(
            "=" * 72
        )

        print(
            "PREVENT-X 10-SECOND NETWORK STATE"
        )

        print(
            "=" * 72
        )

        print(
            f"State number          : "
            f"{self.engine.total}"
        )

        print(
            f"Start timestamp       : "
            f"{state['start_ts']}"
        )

        print(
            f"End timestamp         : "
            f"{state['end_ts']}"
        )

        print(
            f"Packets in state      : "
            f"{state['packet_count']:,}"
        )

        print(
            f"Packets/sec           : "
            f"{state['packet_count'] / 10.0:,.2f}"
        )

        print(
            f"Total packets seen    : "
            f"{self.packet_counter:,}"
        )

        print(
            f"History states        : "
            f"{min(self.engine.total, 5)}/5"
        )

        if self.engine.matrix() is None:

            print(
                "Forecast status       : "
                "WAITING FOR 5 STATES"
            )

        else:

            peak_index = int(
                forecast.argmax()
            )

            peak_risk = float(
                forecast[peak_index]
            )

            warning = (
                peak_risk
                >= self.model.threshold
            )

            print(
                "Forecast status       : "
                "READY"
            )

            print(
                f"Peak risk             : "
                f"{peak_risk:.6f}"
            )

            print(
                f"Peak horizon          : "
                f"+{HORIZONS[peak_index]}s"
            )

            print(
                f"Warning               : "
                f"{'YES' if warning else 'NO'}"
            )

            if warning:

                warning_horizons = [
                    HORIZONS[i]
                    for i, value in enumerate(
                        forecast
                    )
                    if value
                    >= self.model.threshold
                ]

                print(
                    f"Warning horizons      : "
                    f"{warning_horizons}"
                )

        print(
            "=" * 72
        )

        print()

    # ========================================================
    # SUBSCRIBE
    # ========================================================

    async def subscribe(self):

        q = asyncio.Queue(
            maxsize=100
        )

        self.subs.add(
            q
        )

        try:

            while True:

                yield await q.get()

        finally:

            self.subs.discard(
                q
            )

    # ========================================================
    # STATUS
    # ========================================================

    def status(self):

        return {

            "mode":
                self.mode,

            "state_count":
                self.engine.total,

            "ready_for_forecast":
                self.engine.matrix()
                is not None,

            "model_loaded":
                self.model.loaded,

            "interface":
                self.interface,

            "packet_counter":
                self.packet_counter,

            "packet_display":
                self.packet_display,

            "latest":
                self.history[-1]
                if self.history
                else None,

            "recent_packets":
                list(
                    self.packet_history
                ),
        }

    # ========================================================
    # STOP
    # ========================================================

    async def stop(self):

        if self.capture:

            try:

                self.capture.stop()

            except Exception as e:

                print(
                    f"[capture-stop] "
                    f"{type(e).__name__}: {e}",
                    flush=True
                )

            self.capture = None

        if self.replay:

            try:

                self.replay.stop()

            except Exception as e:

                print(
                    f"[replay-stop] "
                    f"{type(e).__name__}: {e}",
                    flush=True
                )

            self.replay = None

        self.mode = "stopped"

    # ========================================================
    # LIVE CAPTURE
    # ========================================================

    async def live(
        self,
        iface=""
    ):

        await self.stop()

        self.engine.reset()
        self.history.clear()
        self.packet_history.clear()

        self.packet_counter = 0

        self.mode = "live"
        self.interface = iface

        from scapy.all import AsyncSniffer

        from ..packet_features import (
            from_scapy
        )

        loop = (
            asyncio.get_running_loop()
        )

        # ----------------------------------------------------
        # Terminal header
        # ----------------------------------------------------

        print()

        print(
            "=" * 72
        )

        print(
            "PREVENT-X LIVE NETWORK MONITOR"
        )

        print(
            "=" * 72
        )

        print(
            f"Interface             : "
            f"{iface or 'Scapy default'}"
        )

        print(
            "Packet capture        : ENABLED"
        )

        print(
            "Frontend packet stream: ENABLED"
        )

        print(
            "State duration        : 10 seconds"
        )

        print(
            "Feature count         : 45"
        )

        print(
            "Temporal history      : 5 states / 50 seconds"
        )

        print(
            "Forecast horizons     : "
            "+10 +20 +30 +40 +50 +60 seconds"
        )

        print(
            f"Risk threshold        : "
            f"{self.model.threshold}"
        )

        print(
            "=" * 72
        )

        print()

        # ----------------------------------------------------
        # Scapy callback
        # ----------------------------------------------------

        def cb(pkt):

            try:

                packet_record = (
                    from_scapy(pkt)
                )

                # ------------------------------------------------
                # Send packet to frontend + terminal.
                #
                # run_coroutine_threadsafe is required because
                # Scapy callback executes outside the asyncio loop.
                # ------------------------------------------------

                asyncio.run_coroutine_threadsafe(
                    self._emit_packet(
                        pkt,
                        packet_record
                    ),
                    loop
                )

                # ------------------------------------------------
                # Feed packet into 10-second state engine.
                # ------------------------------------------------

                emitted_states = (
                    self.engine.add(
                        packet_record
                    )
                )

                # ------------------------------------------------
                # Process completed states.
                # ------------------------------------------------

                for state in emitted_states:

                    asyncio.run_coroutine_threadsafe(
                        self.emit(state),
                        loop
                    )

            except Exception as e:

                print(
                    f"[capture-error] "
                    f"{type(e).__name__}: {e}",
                    flush=True
                )

        # ----------------------------------------------------
        # Start capture
        # ----------------------------------------------------

        try:

            print(
                f"[capture] Starting interface: "
                f"{iface or 'Scapy default'}",
                flush=True
            )

            self.capture = AsyncSniffer(
                iface=iface or None,
                prn=cb,
                store=False
            )

            self.capture.start()

            print(
                "[capture] Sniffer started successfully",
                flush=True
            )

            print(
                "[capture] Waiting for packets...",
                flush=True
            )

        except Exception as e:

            self.capture = None

            self.mode = "stopped"

            print(
                f"[capture-start-error] "
                f"{type(e).__name__}: {e}",
                flush=True
            )

            raise RuntimeError(
                f"Unable to start packet capture: "
                f"{type(e).__name__}: {e}"
            ) from e

    # ========================================================
    # PCAP REPLAY
    # ========================================================

    async def replay_pcap(
        self,
        path,
        speed=1.0
    ):

        await self.stop()

        self.engine.reset()
        self.history.clear()
        self.packet_history.clear()

        self.packet_counter = 0

        self.mode = "replay"

        class ReplayCtl:

            def __init__(self):
                self.running = True

            def stop(self):
                self.running = False

        self.replay = ReplayCtl()

        print()

        print(
            "=" * 72
        )

        print(
            "PREVENT-X PCAP REPLAY"
        )

        print(
            "=" * 72
        )

        print(
            f"File                  : "
            f"{path}"
        )

        print(
            f"Replay speed          : "
            f"{speed}x"
        )

        print(
            "Frontend packet stream: ENABLED"
        )

        print(
            "State duration        : 10 seconds"
        )

        print(
            "Feature count         : 45"
        )

        print(
            "History               : 5 states / 50 seconds"
        )

        print(
            "=" * 72
        )

        async def run():

            from scapy.utils import (
                PcapReader
            )

            from ..packet_features import (
                from_scapy
            )

            previous_ts = None

            try:

                with PcapReader(
                    path
                ) as reader:

                    for pkt in reader:

                        if not self.replay.running:
                            break

                        ts = float(
                            getattr(
                                pkt,
                                "time",
                                0
                            )
                        )

                        if previous_ts is not None:

                            delay = (
                                ts - previous_ts
                            ) / max(
                                float(speed),
                                0.05
                            )

                            await asyncio.sleep(
                                min(
                                    2.0,
                                    max(
                                        0.0,
                                        delay
                                    )
                                )
                            )

                        previous_ts = ts

                        packet_record = (
                            from_scapy(pkt)
                        )

                        # ------------------------------------------------
                        # Send packet event to frontend.
                        # ------------------------------------------------

                        await self._emit_packet(
                            pkt,
                            packet_record
                        )

                        # ------------------------------------------------
                        # Feed state engine.
                        # ------------------------------------------------

                        emitted_states = (
                            self.engine.add(
                                packet_record
                            )
                        )

                        for state in emitted_states:

                            await self.emit(
                                state
                            )

                # ------------------------------------------------
                # Flush final state
                # ------------------------------------------------

                if self.replay.running:

                    for state in (
                        self.engine.flush()
                    ):

                        await self.emit(
                            state
                        )

            except Exception as e:

                print(
                    f"[replay-error] "
                    f"{type(e).__name__}: {e}",
                    flush=True
                )

            finally:

                self.mode = "stopped"

                if self.replay:

                    self.replay.running = False

                print()

                print(
                    "=" * 72
                )

                print(
                    "PREVENT-X REPLAY FINISHED"
                )

                print(
                    "=" * 72
                )

                print(
                    f"Packets processed     : "
                    f"{self.packet_counter:,}"
                )

                print(
                    f"States generated      : "
                    f"{self.engine.total}"
                )

                print(
                    "=" * 72
                )

        asyncio.create_task(
            run()
        )