export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x; this.y = y; this.z = z;
  }

  clone(): Vector3 { return new Vector3(this.x, this.y, this.z); }

  set(x: number = 0, y: number = 0, z: number = 0): void {
    this.x = x; this.y = y; this.z = z;
  }

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  addEq(v: Vector3): this {
    this.x += v.x; this.y += v.y; this.z += v.z; return this;
  }

  sub(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  subEq(v: Vector3): this {
    this.x -= v.x; this.y -= v.y; this.z -= v.z; return this;
  }

  mul(a: number): Vector3 {
    return new Vector3(this.x * a, this.y * a, this.z * a);
  }

  mulEq(a: number): this {
    this.x *= a; this.y *= a; this.z *= a; return this;
  }

  div(a: number): Vector3 {
    return new Vector3(this.x / a, this.y / a, this.z / a);
  }

  divEq(a: number): this {
    this.x /= a; this.y /= a; this.z /= a; return this;
  }

  move(v: Vector3, t: number): this {
    this.x += v.x * t; this.y += v.y * t; this.z += v.z * t; return this;
  }

  abs2(): number { return this.x * this.x + this.y * this.y + this.z * this.z; }
  abs(): number { return Math.sqrt(this.abs2()); }

  inprod(v: Vector3): number { return this.x * v.x + this.y * v.y + this.z * v.z; }

  outprod(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  norm(): Vector3 {
    const len = this.abs();
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  normalize(): this {
    const len = this.abs();
    this.x /= len; this.y /= len; this.z /= len; return this;
  }
}
