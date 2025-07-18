/**
 * Divides a CIDR block into a specified number of equal-sized subnets.
 *
 * @param {string} cidr - The base CIDR block (e.g., "10.0.0.0/24").
 * @param {number} numSubnets - The number of desired subnets (positive integer).
 * @returns {string[]} An array of subnet CIDR strings.
 * @throws {TypeError} If `cidr` is not a string or `numSubnets` is not a positive integer.
 * @throws {Error} If the requested number of subnets exceeds the capacity of the base block.
 *
 * @example
 * // Split 10.0.0.0/24 into 4 subnets:
 * // ["10.0.0.0/26", "10.0.0.64/26", "10.0.0.128/26", "10.0.0.192/26"]
 * divideCIDRIntoSubnets('10.0.0.0/24', 4);
 */
export function divideCIDRIntoSubnets(
  cidr: string,
  numSubnets: number,
): string[] {
  // Validate inputs
  if (typeof cidr !== "string") {
    throw new TypeError("Parameter `cidr` must be a string.");
  }
  if (!Number.isInteger(numSubnets) || numSubnets < 1) {
    throw new TypeError("Parameter `numSubnets` must be a positive integer.");
  }

  // Parse the base network
  const baseNet = new BasicNetmask(cidr);
  const originalPrefix = baseNet.prefix;
  const bitsNeeded = Math.ceil(Math.log2(numSubnets));
  const newPrefix = originalPrefix + bitsNeeded;
  const maxSubnets = 1 << bitsNeeded; // 2^bitsNeeded

  // Ensure capacity
  if (numSubnets > maxSubnets) {
    throw new Error(
      `Cannot fit ${numSubnets} subnets into ${cidr} (maximum is ${maxSubnets}).`,
    );
  }

  // Generate subnets
  const subnets = [];
  // Start at the first subnet address
  let current = new BasicNetmask(`${baseNet.base}/${newPrefix}`);

  for (let i = 0; i < numSubnets; i++) {
    subnets.push(`${current.base}/${newPrefix}`);
    current = current.next();
  }

  return subnets;
}

/**
 * Represents an IPv4 CIDR block, providing parsing, iteration, and containment checks.
 *
 * @example
 * const net = new BasicNetmask("192.168.1.0/24");
 * console.log(net.base);        // "192.168.1.0"
 * console.log(net.prefix);      // 24
 * console.log(net.size);        // 256
 * console.log(net.broadcast);   // "192.168.1.255"
 * const next = net.next();
 * console.log(next.base);       // "192.168.2.0"
 * console.log(net.contains("192.168.1.100")); // true
 * console.log(net.contains(new BasicNetmask("192.168.2.0/24"))); // false
 */
export class BasicNetmask {
  /** The canonical network address in dotted-decimal notation. */
  public readonly base: string;
  /** The CIDR prefix length (0–32). */
  public readonly prefix: number;
  /** Numeric representation of the network address (32-bit unsigned integer). */
  private readonly networkAddress: number;

  /**
   * Constructs a BasicNetmask from a CIDR string.
   *
   * @param {string} cidr - The CIDR block (e.g., "10.0.0.0/24").
   * @throws {TypeError} If the CIDR string is malformed or prefix is out of range.
   */
  constructor(cidr: string) {
    if (typeof cidr !== "string") {
      throw new TypeError("CIDR must be a string");
    }
    const parts = cidr.trim().split("/");
    if (parts.length !== 2) {
      throw new TypeError(`Invalid CIDR format: ${cidr}`);
    }
    const [ip, prefixStr] = parts;
    const prefix = Number(prefixStr);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new TypeError(`Invalid prefix length: ${prefixStr}`);
    }

    const ipLong = BasicNetmask.ipToLong(ip);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    this.networkAddress = ipLong & mask;
    this.base = BasicNetmask.longToIp(this.networkAddress);
    this.prefix = prefix;
  }

  /**
   * Returns the next consecutive subnet of the same size.
   *
   * @returns {BasicNetmask} The next subnet.
   */
  public next(): BasicNetmask {
    const nextAddr = (this.networkAddress + this.size) >>> 0;
    return new BasicNetmask(
      `${BasicNetmask.longToIp(nextAddr)}/${this.prefix}`,
    );
  }

  /**
   * Checks if an IP or subnet is contained within this CIDR.
   *
   * @param {string | BasicNetmask} target - The IP address or subnet to test.
   * @returns {boolean} True if contained, false otherwise.
   */
  public contains(target: string | BasicNetmask): boolean {
    let start: number, end: number;
    if (typeof target === "string") {
      const ipLong = BasicNetmask.ipToLong(target);
      start = ipLong;
      end = ipLong + 1;
    } else {
      start = target.networkAddress;
      end = target.networkAddress + target.size;
    }
    return start >= this.networkAddress &&
      end <= this.networkAddress + this.size;
  }

  /**
   * Total number of addresses in this subnet.
   */
  public get size(): number {
    return 2 ** (32 - this.prefix);
  }

  /**
   * Broadcast address (highest IP) of this subnet.
   */
  public get broadcast(): string {
    const bcastNum = (this.networkAddress + this.size - 1) >>> 0;
    return BasicNetmask.longToIp(bcastNum);
  }

  /**
   * Converts a dotted-decimal IP string to a 32-bit unsigned integer.
   *
   * @param {string} ip - The IPv4 address (e.g., "192.168.0.1").
   * @returns {number} The numeric representation.
   * @throws {TypeError} If the IP is invalid.
   */
  private static ipToLong(ip: string): number {
    const octets = ip.trim().split(".");
    if (octets.length !== 4) {
      throw new TypeError(`Invalid IPv4 address: ${ip}`);
    }
    const num = octets.reduce((acc, octet) => {
      const val = Number(octet);
      if (!Number.isInteger(val) || val < 0 || val > 255) {
        throw new TypeError(`Invalid octet in IP: ${octet}`);
      }
      return (acc << 8) + val;
    }, 0);
    return num >>> 0;
  }

  /**
   * Converts a 32-bit unsigned integer to a dotted-decimal IP string.
   *
   * @param {number} num - The numeric IP.
   * @returns {string} The dotted-decimal representation.
   */
  private static longToIp(num: number): string {
    return [
      (num >>> 24) & 0xff,
      (num >>> 16) & 0xff,
      (num >>> 8) & 0xff,
      num & 0xff,
    ].join(".");
  }
}

export function isValidAddressSpace(cidr: string): boolean {
  const parts = cidr.split("/");
  if (parts.length !== 2) return false;

  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);

  if (prefix < 0 || prefix > 32) return false;

  const octets = ip.split(".");
  if (octets.length !== 4) return false;

  for (const octet of octets) {
    const num = parseInt(octet, 10);
    if (isNaN(num) || num < 0 || num > 255) return false;
  }

  return true;
}

export function addressSpaceContainsSubspace(
  space: string,
  maybeSubspace: string,
): boolean | Error {
  if (!isValidAddressSpace(maybeSubspace)) {
    return new Error(`Invalid subspace address space: ${maybeSubspace}`);
  }

  if (!isValidAddressSpace(space)) {
    return new Error(`Invalid container address space: ${space}`);
  }

  const [_subspaceIp, subspacePrefix] = maybeSubspace.split("/");
  const [_containerIp, containerPrefix] = space.split("/");

  if (parseInt(subspacePrefix, 10) > parseInt(containerPrefix, 10)) {
    return false; // subspace cannot have a larger prefix than container
  }

  const subspaceNet = new BasicNetmask(maybeSubspace);
  const containerNet = new BasicNetmask(space);

  return containerNet.contains(subspaceNet);
}

export function addressSpaceOverlaps(
  space: string,
  maybeSubspace: string,
): boolean | Error {
  if (!isValidAddressSpace(maybeSubspace)) {
    return new Error(`Invalid subspace address space: ${maybeSubspace}`);
  }

  if (!isValidAddressSpace(space)) {
    return new Error(`Invalid container address space: ${space}`);
  }

  const subspaceNet = new BasicNetmask(maybeSubspace);
  const containerNet = new BasicNetmask(space);

  return containerNet.contains(subspaceNet) ||
    subspaceNet.contains(containerNet);
}
