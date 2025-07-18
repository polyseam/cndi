/**
 * Convert an IPv4 address string (e.g. "192.168.0.1") into a 32-bit number.
 * We split on dots, then for each octet shift the accumulated value left 8 bits
 * and add the numeric value of the octet.
 */
function ipToLong(ip: string): number {
  // Split the IP into 4 parts, then fold them into one 32-bit integer
  return ip
    .split(".")
    .reduce((acc, octet) => {
      // Shift existing bits left by 8 and add the new octet value
      return (acc << 8) + parseInt(octet, 10);
    }, 0) >>> 0; // Ensure unsigned result
}

/**
 * Convert a 32-bit number back into an IPv4 string.
 * We extract each 8-bit segment by shifting and masking.
 */
function longToIp(long: number): string {
  // Extract each byte from the 32-bit integer
  return [
    (long >>> 24) & 0xFF, // highest-order byte
    (long >>> 16) & 0xFF,
    (long >>> 8) & 0xFF,
    long & 0xFF, // lowest-order byte
  ].join(".");
}

/**
 * BasicNetmask represents a CIDR block (e.g., "192.168.0.0/24").
 * - base: the network address as a string.
 * - bitmask: the prefix length (number of bits fixed in the mask).
 * - networkAddress: numeric form of the base address.
 */
export class BasicNetmask {
  base: string;
  bitmask: number;
  private networkAddress: number;

  constructor(cidr: string) {
    // Split the CIDR into IP and prefix length (e.g., "192.168.0.0" and "24")
    const [ip, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    // Create a mask with prefix number of 1 bits followed by zeros.
    // For example, prefix 24 => 0xFFFFFF00
    const mask = prefix === 0 ? 0 : (-1 << (32 - prefix)) >>> 0;
    const ipLong = ipToLong(ip);
    const networkAddress = ipLong & mask;
    // Apply the mask to zero out host bits, yielding the network address
    this.networkAddress = networkAddress;
    this.base = longToIp(networkAddress);
    this.bitmask = prefix;
  }

  /**
   * Calculate the next consecutive subnet of the same size.
   * We add the block size (2^(32 - bitmask)) to the numeric network address.
   */
  next(): BasicNetmask {
    const blockSize = 2 ** (32 - this.bitmask);
    const nextNetworkAddress = (this.networkAddress + blockSize) >>> 0;
    return new BasicNetmask(`${longToIp(nextNetworkAddress)}/${this.bitmask}`);
  }

  /**
   * Check if an IPv4 address or Netmask string is within this CIDR block.
   * We convert the IP to a 32-bit number and ensure it's between
   * the network address (inclusive) and the end of the block (exclusive).
   */
  contains(arg: string | BasicNetmask): boolean {
    // Determine the numeric start and end of the range to check
    let start: number;
    let end: number;

    if (typeof arg === "string") {
      // Convert single IP to numeric range [ip, ip+1)
      start = ipToLong(arg);
      end = start + 1;
    } else {
      // Input is another BasicNetmask; get its network and block size
      start = arg.networkAddress;
      end = start + 2 ** (32 - arg.bitmask);
    }

    // This block's numeric range
    const thisStart = this.networkAddress;
    const thisEnd = thisStart + 2 ** (32 - this.bitmask);

    // Return true if the entire range [start, end) is within [thisStart, thisEnd)
    return start >= thisStart && end <= thisEnd;
  }
}
