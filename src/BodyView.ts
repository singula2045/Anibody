import { Vector3 } from './Vector3';
import { Point, PolyBuffer, PolyIndex, T1, T2, T3, cPosMax, cMaxPolyBuffer, Q, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './Body';
import { BodyModel } from './BodyModel';

export class BodyView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  keyState: boolean[] = new Array(256).fill(false);

  private polybuf: PolyBuffer[] = [];
  private polyindex: PolyIndex[] = [];
  iPolyCount: number = 0;

  private bWireView: boolean = true;
  private bPointView: boolean = false;
  private bEdgeView: boolean = false;
  private bFlatShade: boolean = false;
  private bUseEdge: boolean = true;
  private bUseBody: boolean[] = [true, false];
  private bPointSelect: boolean[] = new Array(30).fill(false);
  private bPointSelectFlag: boolean = false;

  private ctTime: number[] = new Array(20).fill(0);
  private iTime: number = 0;

  vNorm: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  angle: Vector3 = new Vector3();
  camera_pos: Vector3 = new Vector3();
  private camera_v: Vector3 = new Vector3();
  private iBodyNo: number = 0;

  private vp: Vector3 = new Vector3();
  private sx: number = 0;
  private sy: number = 0;
  private dsx: number = 0;
  private dsy: number = 0;
  private bLeftButton: boolean = false;

  body: BodyModel[] = [new BodyModel(), new BodyModel()];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = CANVAS_WIDTH;
    this.offscreen.height = CANVAS_HEIGHT;
    this.offCtx = this.offscreen.getContext('2d')!;

    for (let i = 0; i < cMaxPolyBuffer; i++) {
      this.polybuf.push({
        pos: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        color: [0, 0, 0, 0], edge: 0, kind: 0
      });
      this.polyindex.push({ no: i, z: 0 });
    }

    this.camera_v.set(0, 0, 0);
    this.angle.set(-0.2, 0, -7.2);
    this.camera_pos.set(0, -64, 0);

    this.body[0].setName('Body1');
    this.body[1].setName('Body2');
    this.body[0].init();
    this.body[1].init();

    this.vp.set(0, 0, 0);
    this.body[1].move(new Vector3(0, 10, 0));
    this.setupEvents();
  }

  private setupEvents(): void {
    document.addEventListener('keydown', (e) => {
      const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
      if (code > 0 && code < 256) this.keyState[code] = true;
    });
    document.addEventListener('keyup', (e) => {
      const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
      if (code > 0 && code < 256) this.keyState[code] = false;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.onLButtonDown(e.clientX - r.left, e.clientY - r.top);
    });
    this.canvas.addEventListener('mouseup', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.onLButtonUp(e.clientX - r.left, e.clientY - r.top);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.bLeftButton) {
        const r = this.canvas.getBoundingClientRect();
        this.onMouseMove(e.clientX - r.left, e.clientY - r.top);
      }
    });
  }

  clearPointSelect(): void {
    for (let i = 0; i < cPosMax; i++) this.bPointSelect[i] = false;
  }

  mcalc(): void {
    const ax = this.angle.x, ay = this.angle.y, az = this.angle.z;
    const sina = Math.sin(ax);
    let cosa = Math.cos(ax);
    if (Math.abs(cosa) < 1e-9) cosa = cosa >= 0 ? 1e-9 : -1e-9;
    const sinb = Math.sin(ay), cosb = Math.cos(ay);
    const sinc = Math.sin(az), cosc = Math.cos(az);
    const sasc = sina * sinc, sacc = sina * cosc;
    this.vNorm[0].set(cosb * cosc - sasc * sinb, -cosb * sinc - sacc * sinb, -sinb * cosa);
    this.vNorm[1].set(cosa * sinc, cosa * cosc, -sina);
    this.vNorm[2].set(sinb * cosc + sasc * cosb, -sinb * sinc + sacc * cosb, cosb * cosa);
  }

  changeWtoV(vWorldPos: Vector3, vViewPos: Vector3): void {
    vViewPos.x = vWorldPos.inprod(this.vNorm[0]);
    vViewPos.y = vWorldPos.inprod(this.vNorm[1]);
    vViewPos.z = vWorldPos.inprod(this.vNorm[2]);
  }

  changeVtoW(vViewPos: Vector3, vWorldPos: Vector3): void {
    vWorldPos.x = vViewPos.x * this.vNorm[0].x + vViewPos.y * this.vNorm[1].x + vViewPos.z * this.vNorm[2].x;
    vWorldPos.y = vViewPos.x * this.vNorm[0].y + vViewPos.y * this.vNorm[1].y + vViewPos.z * this.vNorm[2].y;
    vWorldPos.z = vViewPos.x * this.vNorm[0].z + vViewPos.y * this.vNorm[1].z + vViewPos.z * this.vNorm[2].z;
  }

  changeVtoS(vViewPos: Vector3, sScreenPos: Point): void {
    const z = (vViewPos.y - this.camera_pos.y) / 10;
    sScreenPos.x = Math.trunc((vViewPos.x - this.camera_pos.x) * Q / z + 200);
    sScreenPos.y = Math.trunc((vViewPos.z - this.camera_pos.z) * Q / z + 150);
  }

  draw(): void {
    const ctx = this.offCtx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.mcalc();
    this.iPolyCount = 0;
    this.iTime++;

    if (this.iTime > 2) {
      for (let i = 0; i < 2; i++)
        if (this.bUseBody[i]) this.body[i].draw(this);
    }

    this.flushPolyBuffer();

    if (this.bPointView) {
      for (let i = 0; i < 2; i++)
        if (this.bUseBody[i]) this.body[i].drawPoint(this);
    }

    if (!this.bPointSelectFlag && this.bLeftButton) {
      const x1 = Math.min(this.sx, this.dsx), x2 = Math.max(this.sx, this.dsx);
      const y1 = Math.min(this.sy, this.dsy), y2 = Math.max(this.sy, this.dsy);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.5;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    ctx.fillStyle = '#000000';
    ctx.font = '14px monospace';
    ctx.fillText(String(this.iPolyCount).padStart(4) + ' poly', 10, 20);

    this.ctTime[this.iTime % 20] = performance.now();
    if (this.iTime > 20) {
      const dt = this.ctTime[this.iTime % 20] - this.ctTime[(this.iTime + 1) % 20];
      const fps = dt > 0 ? (10000.0 / dt) : 0;
      ctx.fillText(fps.toFixed(1).padStart(5) + ' FPS', 10, 40);
    }

    this.ctx.drawImage(this.offscreen, 0, 0);
  }

  private flushPolyBuffer(): void {
    const n = this.iPolyCount;
    const sub = this.polyindex.slice(0, n);
    sub.sort((a, b) => (a.z < b.z ? 1 : -1));
    for (let i = 0; i < n; i++) this.polyindex[i] = sub[i];

    for (let i = 0; i < n; i++) {
      const j = this.polyindex[i].no;
      if (this.bUseEdge && this.polybuf[j].edge)
        this.drawPolygonEdge(this.polybuf[j].pos, this.polybuf[j].edge);
      if (this.bWireView)
        this.drawAnimePolygon(this.polybuf[j].pos, this.polybuf[j].kind, this.polybuf[j].color);
    }
  }

  private drawPolygonEdge(p: Point[], iEdgeFlag: number): void {
    const ctx = this.offCtx;
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
    let mask = 1;
    for (let k = 0; k < 4; k++) {
      if (iEdgeFlag & mask) {
        const m = (k + 1) % 4, n2 = (k + 2) % 4;
        ctx.beginPath(); ctx.moveTo(p[m].x, p[m].y); ctx.lineTo(p[n2].x, p[n2].y); ctx.stroke();
      }
      mask <<= 1;
    }
  }

  private cVal(c: number): number {
    if (c < T1) return 0;
    if (c > T3) return 3;
    if (c > T2) return 2;
    return 1;
  }

  private inP(p0: Point, p1: Point, p2: Point, c0: number, c1: number, c2: number): void {
    const t = (c2 - c0) / (c1 - c0);
    p2.x = p0.x + Math.trunc((p1.x - p0.x) * t);
    p2.y = p0.y + Math.trunc((p1.y - p0.y) * t);
  }

  private drawAnimePolygon(p: Point[], kind: number, c: number[]): void {
    const ctx = this.offCtx;

    const no: number[][] = Array.from({ length: 4 }, () => new Array(8).fill(-1));
    const pos: Point[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 8 }, () => ({ x: 0, y: 0 }))
    );

    for (let i = 0; i < 4; i++) no[i][0] = this.cVal(c[i]);

    const allSame = no[0][0] === no[1][0] && no[1][0] === no[2][0] && no[2][0] === no[3][0];
    if (this.bFlatShade || allSame) {
      ctx.fillStyle = COLORS[kind][no[0][0]];
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.closePath(); ctx.fill();
      return;
    }

    for (let i = 0; i < 4; i++) { pos[i][0].x = p[i].x; pos[i][0].y = p[i].y; }

    for (let i = 0; i < 4; i++) {
      let count = 1;
      const s = no[i][0], e = no[(i + 1) % 4][0];

      if (s > e) {
        if (s > 2) {
          this.inP(p[(i + 1) % 4], p[i], pos[i][count], c[(i + 1) % 4], c[i], T3);
          no[i][count] = 2; no[i][count + 1] = 3;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
        if (s >= 2 && e <= 1) {
          this.inP(p[(i + 1) % 4], p[i], pos[i][count], c[(i + 1) % 4], c[i], T2);
          no[i][count] = 1; no[i][count + 1] = 2;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
        if (e === 0) {
          this.inP(p[(i + 1) % 4], p[i], pos[i][count], c[(i + 1) % 4], c[i], T1);
          no[i][count] = 0; no[i][count + 1] = 1;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
      } else if (s < e) {
        if (s === 0) {
          this.inP(p[i], p[(i + 1) % 4], pos[i][count], c[i], c[(i + 1) % 4], T1);
          no[i][count] = 0; no[i][count + 1] = 1;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
        if (e >= 2 && s <= 1) {
          this.inP(p[i], p[(i + 1) % 4], pos[i][count], c[i], c[(i + 1) % 4], T2);
          no[i][count] = 1; no[i][count + 1] = 2;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
        if (e > 2) {
          this.inP(p[i], p[(i + 1) % 4], pos[i][count], c[i], c[(i + 1) % 4], T3);
          no[i][count] = 2; no[i][count + 1] = 3;
          pos[i][count + 1].x = pos[i][count].x; pos[i][count + 1].y = pos[i][count].y;
          count += 2;
        }
      }

      for (let j = count; j < 8; j++) no[i][j] = -1;
    }

    const polybuf: Point[] = [];
    for (let ci = 0; ci < 4; ci++) {
      polybuf.length = 0;
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 8; k++)
          if (no[j][k] === ci) polybuf.push(pos[j][k]);

      if (polybuf.length > 2) {
        ctx.fillStyle = COLORS[kind][ci];
        ctx.beginPath(); ctx.moveTo(polybuf[0].x, polybuf[0].y);
        for (let i = 1; i < polybuf.length; i++) ctx.lineTo(polybuf[i].x, polybuf[i].y);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  drawPolygon(pos: Point[], kind: number, color: number[], zval: number, iEdgeFlag: number): void {
    if (this.iPolyCount >= cMaxPolyBuffer) { console.error('polybuf overflow'); return; }
    const buf = this.polybuf[this.iPolyCount];
    buf.pos[0].x = pos[0].x; buf.pos[0].y = pos[0].y;
    buf.pos[1].x = pos[1].x; buf.pos[1].y = pos[1].y;
    buf.pos[2].x = pos[2].x; buf.pos[2].y = pos[2].y;
    buf.pos[3].x = pos[3].x; buf.pos[3].y = pos[3].y;
    buf.color[0] = color[0]; buf.color[1] = color[1]; buf.color[2] = color[2]; buf.color[3] = color[3];
    buf.kind = kind;
    buf.edge = this.bEdgeView ? 15 : iEdgeFlag;
    this.polyindex[this.iPolyCount].z = zval;
    this.polyindex[this.iPolyCount].no = this.iPolyCount;
    this.iPolyCount++;
  }

  fillRectangle(x: number, y: number, w: number, h: number): void {
    this.offCtx.fillStyle = '#ff0000';
    this.offCtx.fillRect(x, y, w, h);
  }

  idle(): void {
    const ks = this.keyState;
    const K = (ch: string) => ks[ch.charCodeAt(0)];

    if (K('j')) this.angle.z -= 0.1;
    if (K('l')) this.angle.z += 0.1;
    if (K('i')) this.angle.x -= 0.1;
    if (K('k')) this.angle.x += 0.1;
    if (K('a')) this.vp.x -= 0.1;
    if (K('d')) this.vp.x += 0.1;
    if (K('q')) this.vp.y -= 0.1;
    if (K('e')) this.vp.y += 0.1;
    if (K('w')) this.vp.z -= 0.1;
    if (K('s')) this.vp.z += 0.1;
    if (K('u')) this.camera_v.y -= 1;
    if (K('o')) this.camera_v.y += 1;

    if (K(' ')) {
      this.body[this.iBodyNo].move(this.vp.mul(2));
    } else {
      for (let i = 0; i < cPosMax; i++) {
        if (this.bPointSelect[i]) {
          const pos = this.body[this.iBodyNo].pos(i);
          pos.move(this.vp, 10);
          this.body[this.iBodyNo].setPos(i, pos);
        }
      }
    }

    this.vp.move(this.vp, -0.5);
    this.camera_pos.move(this.camera_v, 1);
    this.camera_v.move(this.camera_v, -0.5);

    if (this.camera_pos.y > -10) { this.camera_pos.y = -10; this.camera_v.y = 0; }

    for (let i = 0; i < 2; i++)
      if (this.bUseBody[i]) this.body[i].posCalc();
  }

  private onLButtonDown(x: number, y: number): void {
    this.bLeftButton = true;
    this.sx = x; this.sy = y; this.dsx = x; this.dsy = y;
    let iPointNo = 0;
    this.bPointSelectFlag = false;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < cPosMax; i++) {
        if (this.bUseBody[j] && this.body[j].calcScreenDis(this, i, this.sx, this.sy) < 20) {
          iPointNo = i; this.iBodyNo = j; this.bPointSelectFlag = true;
        }
      }
    }
    if (!this.bPointSelectFlag || !this.bPointSelect[iPointNo])
      for (let i = 0; i < cPosMax; i++) this.bPointSelect[i] = false;
    if (this.bPointSelectFlag) this.bPointSelect[iPointNo] = true;
  }

  private onLButtonUp(x: number, y: number): void {
    this.bLeftButton = false;
    if (!this.bPointSelectFlag) {
      const x1 = Math.min(this.sx, this.dsx), x2 = Math.max(this.sx, this.dsx);
      const y1 = Math.min(this.sy, this.dsy), y2 = Math.max(this.sy, this.dsy);
      for (let i = 0; i < cPosMax; i++) {
        this.bPointSelect[i] = this.body[this.iBodyNo].inScreenArea(this, i, x1, y1, x2, y2);
      }
    }
    this.bPointSelectFlag = false;
  }

  private onMouseMove(x: number, y: number): void {
    if (this.bLeftButton) {
      const dx = (x - this.sx) / 20.0, dy = (y - this.sy) / 20.0;
      if (this.keyState[' '.charCodeAt(0)]) {
        const p = new Vector3(
          dx * this.vNorm[0].x + dy * this.vNorm[2].x,
          dx * this.vNorm[0].y + dy * this.vNorm[2].y,
          dx * this.vNorm[0].z + dy * this.vNorm[2].z
        );
        this.body[this.iBodyNo].move(p);
      } else {
        for (let i = 0; i < cPosMax; i++) {
          if (this.bPointSelect[i]) {
            const p = this.body[this.iBodyNo].pos(i);
            p.x += dx * this.vNorm[0].x + dy * this.vNorm[2].x;
            p.y += dx * this.vNorm[0].y + dy * this.vNorm[2].y;
            p.z += dx * this.vNorm[0].z + dy * this.vNorm[2].z;
            this.body[this.iBodyNo].setPos(i, p);
          }
        }
      }
      this.sx = x; this.sy = y;
    }
  }
}
