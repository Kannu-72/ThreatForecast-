# Controlled Lab Scenarios
Use only on systems/networks you own or are authorized to test.

1. Normal traffic: curl/ping against an isolated lab host.
2. Discovery-style traffic: perform bounded port-diversity testing against an isolated lab target. The dashboard may surface T1046 as heuristic context.
3. Traffic stress: use iperf3 between isolated lab hosts with a bounded duration. The dashboard may surface T1498 as heuristic context.
4. Deterministic demo: replay a recorded PCAP/PCAPNG through the same state engine.

For an SIH demo, the PCAP replay path is the most reproducible; live capture and lab traffic use the same 10-second aggregation and inference path.
