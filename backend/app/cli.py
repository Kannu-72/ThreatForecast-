import argparse, asyncio
from .services.runtime import Runtime
async def main_async(path,speed):
    r=Runtime(); await r.startup(); await r.replay_pcap(path,speed)
    while r.replay and r.replay.running: await asyncio.sleep(.5)
if __name__=='__main__':
    p=argparse.ArgumentParser(); s=p.add_subparsers(dest='cmd',required=True); q=s.add_parser('replay'); q.add_argument('path'); q.add_argument('--speed',type=float,default=1.0); a=p.parse_args(); asyncio.run(main_async(a.path,a.speed))
