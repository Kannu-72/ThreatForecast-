export const HORIZONS = [10, 20, 30, 40, 50, 60];

export const OPERATIONAL_THRESHOLD = 0.05;

export const ATTACK_COLORS = {
  'Port Scan': '#55D6FF',
  'DDoS / DoS': '#FF5C6C',
  'Brute Force': '#FFB454',
  'Public-Facing Service Attack': '#7C8CFF',
  'Network Reconnaissance': '#55D6A5',
};

export const SEVERITY_LEVELS = {
  LOW: { label: 'LOW', color: '#55D6A5', bg: 'rgba(85, 214, 165, 0.12)', border: 'rgba(85, 214, 165, 0.3)' },
  MEDIUM: { label: 'MEDIUM', color: '#FFB454', bg: 'rgba(255, 180, 84, 0.12)', border: 'rgba(255, 180, 84, 0.3)' },
  HIGH: { label: 'HIGH', color: '#FF7C6C', bg: 'rgba(255, 124, 108, 0.12)', border: 'rgba(255, 124, 108, 0.3)' },
  CRITICAL: { label: 'CRITICAL', color: '#FF5C6C', bg: 'rgba(255, 92, 108, 0.16)', border: 'rgba(255, 92, 108, 0.4)' },
};

export const FEATURE_NAMES = [
  'packet_count', 'bytes_total', 'packets_per_sec', 'bytes_per_sec',
  'packet_length_mean', 'packet_length_std', 'packet_length_min', 'packet_length_max',
  'src_ip_count', 'dst_ip_count', 'unique_flow_pairs', 'src_port_count', 'dst_port_count',
  'protocol_count', 'src_to_dst_ip_ratio', 'tcp_packet_ratio', 'udp_packet_ratio', 'icmp_packet_ratio',
  'syn_count', 'syn_ratio', 'ack_count', 'ack_ratio', 'fin_count', 'rst_count', 'rst_ratio',
  'psh_count', 'tcp_flag_pattern_count', 'ttl_mean', 'ttl_std', 'ttl_min', 'ttl_max',
  'tcp_window_mean', 'tcp_window_std', 'zero_tcp_window_ratio', 'src_ip_entropy',
  'dst_port_entropy', 'iat_mean', 'iat_std', 'iat_max', 'active_duration_sec',
  'iat_burstiness', 'max_src_ip_share', 'max_dst_port_share', 'missing_packet_length_ratio', 'missing_ttl_ratio'
];
