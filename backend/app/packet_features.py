from collections import Counter
import math, statistics

FEATURE_NAMES=['packet_count','bytes_total','packets_per_sec','bytes_per_sec','packet_length_mean','packet_length_std','packet_length_min','packet_length_max','src_ip_count','dst_ip_count','unique_flow_pairs','src_port_count','dst_port_count','protocol_count','src_to_dst_ip_ratio','tcp_packet_ratio','udp_packet_ratio','icmp_packet_ratio','syn_count','syn_ratio','ack_count','ack_ratio','fin_count','rst_count','rst_ratio','psh_count','tcp_flag_pattern_count','ttl_mean','ttl_std','ttl_min','ttl_max','tcp_window_mean','tcp_window_std','zero_tcp_window_ratio','src_ip_entropy','dst_port_entropy','iat_mean','iat_std','iat_max','active_duration_sec','iat_burstiness','max_src_ip_share','max_dst_port_share','missing_packet_length_ratio','missing_ttl_ratio']
assert len(FEATURE_NAMES)==45

def ratio(a,b): return float(a/b) if b else 0.0
def ent(xs):
    c=Counter(xs); n=sum(c.values())
    return float(-sum((v/n)*math.log2(v/n) for v in c.values() if v)) if n else 0.0
def sd(xs): return float(statistics.stdev(xs)) if len(xs)>1 else 0.0

def build_features(p):
    n=len(p)
    lens=[x.packet_length for x in p if x.packet_length is not None]; ttls=[x.ttl for x in p if x.ttl is not None]
    tcp=[x for x in p if x.protocol=='TCP']; udp=[x for x in p if x.protocol=='UDP']; icmp=[x for x in p if x.protocol=='ICMP']
    src=[x.src_ip for x in p if x.src_ip]; dst=[x.dst_ip for x in p if x.dst_ip]; sp=[x.src_port for x in p if x.src_port is not None]; dp=[x.dst_port for x in p if x.dst_port is not None]
    flows=[(x.src_ip,x.dst_ip) for x in p if x.src_ip and x.dst_ip]
    syn=sum('S' in (x.tcp_flags or '') for x in tcp); ack=sum('A' in (x.tcp_flags or '') for x in tcp); fin=sum('F' in (x.tcp_flags or '') for x in tcp); rst=sum('R' in (x.tcp_flags or '') for x in tcp); psh=sum('P' in (x.tcp_flags or '') for x in tcp)
    wins=[x.tcp_window for x in tcp if x.tcp_window is not None]; flags=[x.tcp_flags for x in tcp if x.tcp_flags is not None]
    ts=sorted(x.timestamp for x in p); iat=[ts[i]-ts[i-1] for i in range(1,len(ts)) if ts[i]-ts[i-1]>=0]
    im=statistics.mean(iat) if iat else 0.; isd=sd(iat); imx=max(iat) if iat else 0.; dur=(max(ts)-min(ts)) if len(ts)>1 else 0.; burst=ratio(isd-im,isd+im) if isd+im else 0.
    sc=Counter(src); pc=Counter(dp)
    vals=[n,sum(lens),n/10,sum(lens)/10,statistics.mean(lens) if lens else 0.,sd(lens),min(lens) if lens else 0.,max(lens) if lens else 0.,len(set(src)),len(set(dst)),len(set(flows)),len(set(sp)),len(set(dp)),len(set(x.protocol for x in p)),ratio(len(set(src)),len(set(dst))),ratio(len(tcp),n),ratio(len(udp),n),ratio(len(icmp),n),syn,ratio(syn,len(tcp)),ack,ratio(ack,len(tcp)),fin,rst,ratio(rst,len(tcp)),psh,len(set(flags)),statistics.mean(ttls) if ttls else 0.,sd(ttls),min(ttls) if ttls else 0.,max(ttls) if ttls else 0.,statistics.mean(wins) if wins else 0.,sd(wins),ratio(sum(w==0 for w in wins),len(wins)),ent(src),ent(dp),im,isd,imx,dur,burst,ratio(max(sc.values()) if sc else 0,n),ratio(max(pc.values()) if pc else 0,n),ratio(n-len(lens),n),ratio(n-len(ttls),n)]
    if len(vals)!=45: raise RuntimeError(len(vals))
    return vals

class PacketRecord:
    def __init__(self, timestamp,src_ip=None,dst_ip=None,protocol='OTHER',ttl=None,packet_length=None,src_port=None,dst_port=None,tcp_flags=None,tcp_window=None): self.timestamp=timestamp; self.src_ip=src_ip; self.dst_ip=dst_ip; self.protocol=protocol; self.ttl=ttl; self.packet_length=packet_length; self.src_port=src_port; self.dst_port=dst_port; self.tcp_flags=tcp_flags; self.tcp_window=tcp_window

def from_scapy(pkt):
    from scapy.layers.inet import IP,TCP,UDP
    from scapy.layers.inet6 import IPv6
    sip=dip=None; ttl=None
    if IP in pkt:
        sip,dip,ttl=pkt[IP].src,pkt[IP].dst,pkt[IP].ttl; proto={6:'TCP',17:'UDP',1:'ICMP'}.get(pkt[IP].proto,str(pkt[IP].proto))
    elif IPv6 in pkt:
        sip,dip=pkt[IPv6].src,pkt[IPv6].dst; proto={6:'TCP',17:'UDP',58:'ICMP'}.get(pkt[IPv6].nh,str(pkt[IPv6].nh))
    else: proto='OTHER'
    sp=dp=flags=win=None
    if TCP in pkt: sp=int(pkt[TCP].sport); dp=int(pkt[TCP].dport); flags=str(pkt[TCP].flags); win=float(pkt[TCP].window)
    elif UDP in pkt: sp=int(pkt[UDP].sport); dp=int(pkt[UDP].dport)
    return PacketRecord(float(getattr(pkt,'time',0)),sip,dip,proto,ttl,float(len(pkt)),sp,dp,flags,win)
