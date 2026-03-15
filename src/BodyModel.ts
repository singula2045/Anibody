import { Vector3 } from './Vector3';
import { Point, cPosMax } from './Body';
import type { BodyView } from './BodyView';

interface ModelPoint {
  vPos: Vector3;
  vOldPos: Vector3;
  vInitPos: Vector3;
  bUse: boolean;
}

function mk2v(r: number, c: number): Vector3[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => new Vector3()));
}

function mk2p(r: number, c: number): Point[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => ({ x: 0, y: 0 })));
}

function getPosNo(sBuf: string, idx: number): number {
  const parts = sBuf.trim().split(/\s+/);
  if (idx >= parts.length) return 0;
  let v = parseInt(parts[idx], 10);
  if (v > 20) v = 20;
  if (v < 0) v = 0;
  return v;
}

export class BodyModel {
  private name: string = '';
  private mPos: ModelPoint[] = [];
  private vLight: Vector3 = new Vector3();
  private distance: number[] = new Array(35).fill(0);

  private head_age: number = 8.0;
  private head_h: number = 1.2;
  private head_figure: number = 1.5;
  private jaw_figure: number = -0.2;
  private eye_size: number = 0.3;
  private eye_height: number = 6;
  private eye_gap: number = 0.7;
  private eye_angle: number = 0.0;
  private double_eyelid: boolean = true;
  private eye_move: boolean = true;
  private wink: boolean = true;
  private eye_in_r: number = 3.0;
  private eye_light_r: number = 1.0;
  private eye_line: number = 0;
  private head_r: number = 0;
  private eye_timer: number = 0;

  private head_pv: Vector3[][] = mk2v(16, 16);
  private head_n0: Vector3[][] = mk2v(16, 16);
  private head_tp: Vector3 = new Vector3();
  private head_cp: Vector3 = new Vector3();

  private hair_init: boolean = false;
  private hair_p: Vector3[][][] = Array.from({ length: 2 }, () => mk2v(20, 16));

  private skirt_init: boolean = false;
  private skirt_p: Vector3[][] = mk2v(20, 16);

  private skin: boolean = false;

  private hair_vx: number = 0;
  private hair_vy: number = 0;
  private hair_gx: number = 0;
  private hair_gy: number = 0;
  private hair_angle: number = 0;
  private hair_max: number[] = new Array(16).fill(0);

  private hair_vx2: number = 0;
  private hair_vy2: number = 0;
  private hair_gx2: number = 0;
  private hair_gy2: number = 0;
  private hair_angle2: number = 0;
  private hair_max2: number[] = new Array(16).fill(0);

  constructor() {
    for (let i = 0; i < cPosMax; i++) {
      this.mPos.push({
        vPos: new Vector3(), vOldPos: new Vector3(),
        vInitPos: new Vector3(), bUse: false
      });
    }
  }

  init(): void {
    this.skin = false;
    this.head_age = 8.0; this.head_h = 1.2; this.head_figure = 1.5;
    this.jaw_figure = -0.2; this.eye_size = 0.3; this.eye_height = 6;
    this.eye_gap = 0.7; this.eye_angle = 0.0; this.eye_in_r = 3.0;
    this.eye_light_r = 1.0; this.double_eyelid = true;
    this.eye_move = true; this.wink = true;
    this.hair_init = false; this.skirt_init = false;

    this.hair_vx = 0.17; this.hair_vy = -0.03;
    this.hair_gx = -0.013; this.hair_gy = 0.028; this.hair_angle = 0.0;
    this.setHairMax('20 20 20 20 20 15 8 8 8 8 15 20 20 20 20 20');

    this.hair_vx2 = 0.12; this.hair_vy2 = 0.14;
    this.hair_gx2 = -0.005; this.hair_gy2 = 0.0; this.hair_angle2 = 0.0;
    this.setHairMax2('20 20 15 20 12 20 15 12 11 15 20 10 15 20 15 20');

    this.vLight.set(-0.25, -0.5, -0.5);
    this.eye_timer = 0;

    for (let i = 0; i < cPosMax; i++) this.mPos[i].vPos.x = -1000;

    this.mPos[0].vPos.set(-0.0988659, 0.320302, 0.0189341);
    this.mPos[1].vPos.set(-0.728868, 1.20829, -3.86953);
    this.mPos[2].vPos.set(-0.743852, 1.46375, -6.86662);
    this.mPos[3].vPos.set(0.0463491, 0.0658803, -5.47986);
    this.mPos[10].vPos.set(-2.20316, 1.21004, -2.96266);
    this.mPos[11].vPos.set(-2.52937, -0.404083, 0.180357);
    this.mPos[12].vPos.set(-3.26741, -4.04536, 3.67272);
    this.mPos[13].vPos.set(0.672052, 2.01282, -3.25055);
    this.mPos[14].vPos.set(3.28218, 1.24891, -0.972119);
    this.mPos[15].vPos.set(4.41426, -1.82571, 2.93477);
    this.mPos[16].vPos.set(-0.859788, -0.284093, 3.10048);
    this.mPos[17].vPos.set(0.181103, -3.38983, 7.38545);
    this.mPos[18].vPos.set(-2.13814, -1.53053, 13.8014);
    this.mPos[19].vPos.set(1.46213, 0.268095, 2.84257);
    this.mPos[20].vPos.set(3.0335, -2.09734, 7.42801);
    this.mPos[21].vPos.set(2.70674, 0.139826, 14.1279);

    for (let i = 0; i < cPosMax; i++) {
      this.mPos[i].bUse = this.mPos[i].vPos.x > -1000;
      this.mPos[i].vInitPos = this.mPos[i].vPos.clone();
    }

    this.distance[0] = this.calcDis(0, 1);
    this.distance[1] = this.calcDis(10, 13);
    this.distance[2] = this.calcDis(0, 10);
    this.distance[3] = this.calcDis(10, 11);
    this.distance[4] = this.calcDis(11, 12);
    this.distance[5] = this.calcDis(0, 13);
    this.distance[6] = this.calcDis(13, 14);
    this.distance[7] = this.calcDis(14, 15);
    this.distance[8] = this.calcDis(0, 16);
    this.distance[9] = this.calcDis(16, 17);
    this.distance[10] = this.calcDis(17, 18);
    this.distance[11] = this.calcDis(0, 19);
    this.distance[12] = this.calcDis(19, 20);
    this.distance[13] = this.calcDis(20, 21);
    this.distance[14] = this.calcDis(16, 19);
    this.distance[15] = this.calcDis(10, 16);
    this.distance[16] = this.calcDis(13, 19);
    this.distance[17] = this.calcDis(1, 10);
    this.distance[18] = this.calcDis(1, 13);
    this.distance[19] = this.calcDis(1, 2);
    this.distance[20] = this.calcDis(0, 2);
    this.distance[21] = this.calcDis(2, 3);
    this.distance[22] = this.calcDis(1, 3);
    this.distance[23] = this.calcDis(13, 16);
    this.distance[24] = this.calcDis(10, 19);

    this.createHead();

    for (let i = 0; i < cPosMax; i++)
      this.mPos[i].vInitPos = this.mPos[i].vPos.clone();
  }

  pos(no: number): Vector3 { return this.mPos[no].vPos; }
  setPos(no: number, p: Vector3): void { this.mPos[no].vPos = p; }
  movePos(no: number, p: Vector3): void { this.mPos[no].vPos.addEq(p); }

  setName(n: string): void { this.name = n; }
  getName(): string { return this.name; }

  setHairMax(s: string): void {
    for (let i = 0; i < 16; i++) this.hair_max[i] = getPosNo(s, i);
  }
  setHairMax2(s: string): void {
    for (let i = 0; i < 16; i++) this.hair_max2[i] = getPosNo(s, i);
  }

  isSkin(): boolean { return this.skin; }
  setSkin(m: boolean): void { this.skin = m; }

  move(dp: Vector3): void {
    for (let i = 0; i < cPosMax; i++) {
      if (this.mPos[i].bUse) {
        this.mPos[i].vPos.addEq(dp);
        this.mPos[i].vOldPos.addEq(dp);
      }
    }
  }

  draw(pView: BodyView): void {
    this.drawHead(pView);
    this.drawHair(pView);
    this.drawLeg(pView, 10, true);
    this.drawLeg(pView, 13, true);
    this.drawLeg(pView, 16, false);
    this.drawLeg(pView, 19, false);
    this.drawTopBody(pView, 0, 1, 2, 10, 13, 16, 19);
    this.drawBottomBody(pView, 0, 1, 10, 13, 16, 19);
    if (!this.skin) this.drawSkirt(pView);
  }

  drawPoint(pView: BodyView): void {
    const l = new Vector3();
    const v: Point = { x: 0, y: 0 };
    for (let i = 0; i < cPosMax; i++) {
      if (this.mPos[i].bUse) {
        pView.changeWtoV(this.mPos[i].vPos, l);
        pView.changeVtoS(l, v);
        pView.fillRectangle(v.x - 1, v.y - 1, 3, 3);
      }
    }
  }

  private drawLeg(pView: BodyView, posIdx: number, legf: boolean): void {
    const p = mk2v(17, 8);
    const n = mk2v(17, 8);
    const n0 = mk2v(17, 8);
    const l = mk2v(17, 8);
    const s = mk2p(17, 8);

    const sint: number[] = [], cost: number[] = [];
    for (let i = 0; i < 8; i++) {
      const a = i / 8.0 * Math.PI * 2;
      cost.push(Math.cos(a)); sint.push(Math.sin(a));
    }

    const sp = this.mPos[posIdx].vPos;
    const mp = this.mPos[posIdx + 1].vPos;
    const ep = this.mPos[posIdx + 2].vPos;

    const dp = mp.sub(sp);
    const dp2 = ep.sub(mp);
    const r0 = dp.abs();

    let a0 = dp.div(r0);
    let a1 = dp.outprod(dp2); a1.normalize();
    let a2 = a0.outprod(a1); a2.normalize();

    const b0 = dp2.norm();
    let b1 = a1.clone();
    let b2 = b0.outprod(b1); b2.normalize();

    let c0 = a0.add(b0).div(2); c0.normalize();
    let c1 = a1.add(b1).div(2); c1.normalize();
    let c2 = c0.outprod(c1); c2.normalize();

    const rr = a0.inprod(b0);

    const rb0 = [0.0, 0.08, 0.15, 0.3, 0.5, 0.7, 0.9, 0.95];
    let rb1 = [0.4, 0.9, 0.95, 1.0, 0.97, 0.9, 0.8, 0.8];
    let rb2 = [0.4, 0.8, 0.95, 1.0, 0.97, 0.9, 0.8, 0.8];

    const scale = legf ? 0.7 : 1.1;
    for (let i = 0; i < 8; i++) { rb1[i] *= scale; rb2[i] *= scale; }

    // 上腕生成
    let ca1 = a1.clone(), ca2 = a2.clone();
    for (let j = 0; j < 8; j++) {
      if (j >= 7) {
        ca1 = ca1.mul(2).add(c1).div(3);
        ca2 = ca2.mul(2).add(c2).div(3);
      }
      for (let i = 0; i < 8; i++) {
        p[j][i] = sp.add(dp.mul(rb0[j])).add(ca1.mul(cost[i] * rb1[j])).add(ca2.mul(sint[i] * rb2[j]));
        pView.changeWtoV(p[j][i], l[j][i]);
        pView.changeVtoS(l[j][i], s[j][i]);
      }
    }

    const rt0 = [0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0];
    let rt1 = [0.8, 0.9, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0];
    let rt2 = [0.8, 0.9, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0];
    const scale2 = legf ? 0.7 : 1.0;
    for (let i = 0; i < 9; i++) { rt1[i] *= scale2; rt2[i] *= scale2; }

    let cb1 = b1.clone(), cb2 = b2.clone();
    for (let j = 8; j >= 0; j--) {
      if (j < 2) {
        cb1 = cb1.mul(2).add(c1).div(3);
        cb2 = cb2.mul(2).add(c2).div(3);
        if (rr < 0) { rt1[j] *= 1.1; rt2[j] *= 1.1; }
      }
      for (let i = 0; i < 8; i++) {
        p[j + 8][i] = mp.add(dp2.mul(rt0[j])).add(cb1.mul(cost[i] * rt1[j])).add(cb2.mul(sint[i] * rt2[j]));
        pView.changeWtoV(p[j + 8][i], l[j + 8][i]);
        pView.changeVtoS(l[j + 8][i], s[j + 8][i]);
      }
    }

    for (let j = 0; j < 16; j++) {
      for (let i = 0; i < 8; i++) {
        const dx = p[j][i].sub(p[j][(i + 1) % 8]);
        if (j < 15) {
          const dy = p[j][i].sub(p[j + 1][i]);
          n0[j][i] = dx.outprod(dy);
        } else {
          n0[j][i] = p[j][i].sub(p[j + 1][i]);
        }
        n0[j][i].normalize();
        pView.changeWtoV(n0[j][i], n[j][i]);
      }
    }

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];
    for (let j = 0; j < 16; j++) {
      for (let i = 0; i < 8; i++) {
        const ni = (i + 1) % 8;
        if (n[j][i].y < 0 || n[j][ni].y < 0 || n[j + 1][i].y < 0 || n[j + 1][ni].y < 0) {
          buf[0] = s[j][i]; buf[1] = s[j][ni]; buf[2] = s[j + 1][ni]; buf[3] = s[j + 1][i];
          let f = 0;
          if ((n[j][i].y < 0 && n[j][ni].y > 0) || (n[j][i].y > 0 && n[j][ni].y < 0)) f |= 1;
          if ((n[j][i].y < 0 && n[j + 1][i].y > 0) || (n[j][i].y > 0 && n[j + 1][i].y < 0)) f |= 2;
          if (j === 15) f = 0;
          const z = (l[j][i].y + l[j][ni].y + l[j + 1][ni].y + l[j + 1][i].y) / 4.0;
          c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
          c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, (legf && !this.skin) ? 3 : 0, c, z, f);
        }
      }
    }
  }

  private drawTopBody(pView: BodyView, center: number, top: number, head: number, p0: number, p1: number, p2: number, p3: number): void {
    const p = mk2v(12, 16);
    const n = mk2v(12, 16);
    const n0 = mk2v(12, 16);
    const l = mk2v(12, 16);
    const s = mk2p(12, 16);

    const sint: number[] = [], cost: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16.0 * Math.PI * 2;
      cost.push(Math.cos(a)); sint.push(Math.sin(a));
    }

    const cp = this.mPos[center].vPos;
    const lb = this.mPos[p0].vPos;
    const rb = this.mPos[p1].vPos;
    const bcp = this.mPos[top].vPos;
    const dcp = cp.add(bcp.mul(3)).div(4.0);

    const d = bcp.sub(cp);
    const d2 = this.mPos[head].vPos.sub(this.mPos[top].vPos);

    const vXt = lb.sub(rb).norm();
    const vZt = d.norm();
    const vYt = vXt.outprod(vZt);

    const vXc = lb.sub(rb).add(this.mPos[p2].vPos.sub(this.mPos[p3].vPos)).div(2).norm();
    const vZc = bcp.sub(this.mPos[p2].vPos.add(this.mPos[p3].vPos).div(2)).norm();
    const vYc = vXc.outprod(vZc);

    const vXn = vXc.clone();
    const vZn = d2.norm();
    const vYn = vXn.outprod(vZn);

    const dl = dcp.sub(lb).norm();
    const dr = dcp.sub(rb).norm();

    const rt = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 0.9, 0.1, 0.3];
    const rx = [1.4, 1.4, 1.5, 1.6, 1.7, 1.8, 1.7, 1.5, 1.0, 0.4, 0.4, 0.4];
    const ry = [1.0, 1.0, 1.1, 1.2, 1.2, 1.2, 1.1, 0.9, 0.7, 0.4, 0.4, 0.4];

    for (let j = 0; j < 12; j++) {
      let as: number;
      let vX: Vector3, vY: Vector3, vZ: Vector3;
      if (j < 10) {
        as = Math.pow(j / 9.0, 20);
        vX = vXc.mul(1 - as).add(vXt.mul(as));
        vY = vYc.mul(1 - as).add(vYt.mul(as));
        vZ = vZc.mul(1 - as).add(vZt.mul(as));
      } else {
        as = (j - 9) / 2.0;
        vX = vXt.mul(1 - as).add(vXn.mul(as));
        vY = vYt.mul(1 - as).add(vYn.mul(as));
        vZ = vZt.mul(1 - as).add(vZn.mul(as));
      }

      for (let i = 0; i < 16; i++) {
        if (j < 10) {
          p[j][i] = cp.add(d.mul(rt[j]));
        } else {
          p[j][i] = bcp.add(d2.mul(rt[j]));
        }
        p[j][i].addEq(vX.mul(sint[i] * rx[j])).addEq(vY.mul(cost[i] * ry[j]));

        if (j > 0) {
          let d2v = p[j][i].sub(lb);
          let rr = d2v.abs(); if (rr < 0.7) rr = 0.7;
          p[j][i].subEq(dl.div(rr * 1.4));

          d2v = p[j][i].sub(rb);
          rr = d2v.abs(); if (rr < 0.7) rr = 0.7;
          p[j][i].subEq(dr.div(rr * 1.4));
        }

        pView.changeWtoV(p[j][i], l[j][i]);
        pView.changeVtoS(l[j][i], s[j][i]);
      }
    }

    for (let j = 0; j < 11; j++) {
      for (let i = 0; i < 16; i++) {
        const dx = p[j][i].sub(p[j][(i + 1) % 16]);
        const dy = p[j][i].sub(p[j + 1][i]);
        n0[j][i] = dx.outprod(dy); n0[j][i].normalize();
        pView.changeWtoV(n0[j][i], n[j][i]);
      }
    }
    for (let i = 0; i < 16; i++) { n0[11][i] = n0[10][i].clone(); n[11][i] = n[10][i].clone(); }

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];
    for (let j = 0; j < 11; j++) {
      for (let i = 0; i < 16; i++) {
        const ni = (i + 1) % 16;
        if (n[j][i].y < 0 || n[j][ni].y < 0 || n[j + 1][i].y < 0 || n[j + 1][ni].y < 0) {
          buf[0] = s[j][i]; buf[1] = s[j][ni]; buf[2] = s[j + 1][ni]; buf[3] = s[j + 1][i];
          let f = 0;
          if ((n[j][i].y < 0 && n[j][ni].y > 0) || (n[j][i].y > 0 && n[j][ni].y < 0)) f |= 1;
          if ((n[j][i].y < 0 && n[j + 1][i].y > 0) || (n[j][i].y > 0 && n[j + 1][i].y < 0)) f |= 2;
          const z = (l[j][i].y + l[j][ni].y + l[j + 1][ni].y + l[j + 1][i].y) / 4.0;
          c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
          c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, (j < 8 && !this.skin) ? 3 : 0, c, z, f);
        }
      }
    }
  }

  private drawBottomBody(pView: BodyView, center: number, top: number, p0: number, p1: number, p2: number, p3: number): void {
    const p = mk2v(10, 16);
    const n = mk2v(10, 16);
    const n0 = mk2v(10, 16);
    const l = mk2v(10, 16);
    const s = mk2p(10, 16);

    const sint: number[] = [], cost: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16.0 * Math.PI * 2;
      cost.push(Math.cos(a)); sint.push(Math.sin(a));
    }

    const lb = this.mPos[p2].vPos;
    const rb = this.mPos[p3].vPos;
    const cp = this.mPos[center].vPos;
    const bcp = lb.add(rb).div(2);
    const dcp = cp.add(bcp).div(2.0);
    const d = bcp.sub(cp);

    const dl = dcp.sub(lb).norm();
    const dr = dcp.sub(rb).norm();

    const vXb = lb.sub(rb).norm();
    const vZb = d.norm().mul(-1);
    const vYb = vXb.outprod(vZb);

    const vXc = lb.sub(rb).add(this.mPos[p0].vPos.sub(this.mPos[p1].vPos)).div(2).norm();
    const vZc = this.mPos[top].vPos.sub(bcp).norm();
    const vYc = vXc.outprod(vZc);

    const rt = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.75, 0.80, 0.75];
    const rx = [1.4, 1.5, 1.7, 1.8, 1.9, 2.0, 1.8, 1.5, 0.9, 0.0];
    const ry = [1.0, 1.1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.0, 0.5, 0.0];

    for (let j = 0; j < 10; j++) {
      const as = Math.pow(Math.pow(j / 9.0, 3), 20);
      const vX = vXc.mul(1 - as).add(vXb.mul(as));
      const vY = vYc.mul(1 - as).add(vYb.mul(as));

      for (let i = 0; i < 16; i++) {
        let rr = 1.2;
        if (i === 8 || i === 0) rr = 1.0;
        p[j][i] = cp.add(d.mul(rt[j] * rr)).add(vX.mul(sint[i] * rx[j])).add(vY.mul(cost[i] * ry[j]));

        if (j > 0) {
          let dv = p[j][i].sub(lb);
          rr = dv.abs(); if (rr < 0.7) rr = 0.7;
          p[j][i].subEq(dl.div(rr * 1.5));

          dv = p[j][i].sub(rb);
          rr = dv.abs(); if (rr < 0.7) rr = 0.7;
          p[j][i].subEq(dr.div(rr * 1.5));
        }

        pView.changeWtoV(p[j][i], l[j][i]);
        pView.changeVtoS(l[j][i], s[j][i]);
      }
    }

    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < 16; i++) {
        const dx = p[j][i].sub(p[j][(i + 15) % 16]);
        if (j < 9) {
          const dy = p[j][i].sub(p[j + 1][i]);
          n0[j][i] = dx.outprod(dy);
        } else {
          n0[j][i].set(0, 0, 1);
        }
        n0[j][i].normalize();
        pView.changeWtoV(n0[j][i], n[j][i]);
      }
    }

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];
    for (let j = 0; j < 9; j++) {
      for (let i = 0; i < 16; i++) {
        const ni = (i + 1) % 16;
        if (n[j][i].y < 0 || n[j][ni].y < 0 || n[j + 1][i].y < 0 || n[j + 1][ni].y < 0) {
          buf[0] = s[j][i]; buf[1] = s[j][ni]; buf[2] = s[j + 1][ni]; buf[3] = s[j + 1][i];
          let f = 0;
          if ((n[j][i].y < 0 && n[j][ni].y > 0) || (n[j][i].y > 0 && n[j][ni].y < 0)) f |= 4;
          if (j !== 9 && ((n[j][i].y < 0 && n[j + 1][i].y > 0) || (n[j][i].y > 0 && n[j + 1][i].y < 0))) f |= 8;
          const z = (l[j][i].y + l[j][ni].y + l[j + 1][ni].y + l[j + 1][i].y) / 4.0;
          c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
          c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, ((j > 0 && j < 3) || this.skin) ? 0 : 3, c, z, f);
        }
      }
    }
  }

  private createHead(): void {
    const nBands = 16;
    const r = 1.2 + (20 / this.head_age) * 0.15;
    this.head_r = r;
    const h = this.head_h;
    const mo = this.head_figure;
    const a = 0.2 - (20 / this.head_age) * 0.15;
    const e = this.jaw_figure;
    const nh = 0.5 - (20 / this.head_age) * 0.15;

    const h2 = h * 2 / (1 + mo);
    const ha = r * (1 - a) * h;
    const hb = r * (1 + a) * h;
    const dy = -r * h2 * (mo - 1) / 2;
    const h0 = r * h2 - dy - ha;

    const bp = new Vector3(0, 0, -r * h2 * mo - dy);
    this.eye_line = h0 - bp.z;

    this.head_tp.set(0, 0, -(r * h2 - dy));
    this.head_tp.addEq(bp);
    this.head_cp = bp.clone();

    const da = Math.PI / nBands;
    let aa = da;
    const y0 = r * Math.cos(aa) * h2 - dy;
    const rband0 = r * Math.sin(aa);
    let ab = 0;

    for (let i = 0; i < nBands; i++) {
      this.head_pv[0][i].set(rband0 * Math.sin(ab), -rband0 * Math.cos(ab), -y0);
      this.head_pv[0][i].addEq(bp);
      ab += da * 2;
    }

    for (let iBand = 1; iBand < nBands - 1; iBand++) {
      aa += da;
      let rr = r;
      if (aa > Math.PI / 2 && aa <= Math.PI / 2 * 1.5) rr += (aa - Math.PI / 2) * e * 0.5;
      if (aa > Math.PI / 2 * 1.5) rr += (Math.PI - aa) * e * 0.5;
      let rband = Math.sin(aa) * rr;
      let y = Math.cos(aa) * rr * h2;
      if (aa > Math.PI / 2 && aa < Math.PI / 2 * 3) y *= mo;
      y -= dy;

      let rr2 = r;
      const aa2 = aa + da;
      if (aa2 > Math.PI / 2 && aa2 <= Math.PI / 2 * 1.5) rr2 += (aa2 - Math.PI / 2) * e * 0.5;
      if (aa2 > Math.PI / 2 * 1.5) rr2 += (Math.PI - aa2) * e * 0.5;

      ab = 0;
      for (let i = 0; i < nBands; i++) {
        this.head_pv[iBand][i].set(rband * Math.sin(ab), rband * Math.cos(ab), -y);

        if (Math.abs(this.head_pv[iBand][i].x) < r * 0.2 && this.head_pv[iBand][i].y <= 0 && y < h0 && y > h0 - nh * h2 * mo) {
          this.head_pv[iBand][i].y *= 1.0 + ((h0 - y) * 0.3);
        }
        if (Math.abs(h0 - y) < 0.15 && this.head_pv[iBand][i].y <= 0) {
          this.head_pv[iBand][i].y *= 0.90;
          this.head_pv[iBand][i].x *= 0.90;
        }
        if (y < h0) this.head_pv[iBand][i].y -= (h0 - y) * 0.2;

        this.head_pv[iBand][i].y *= -1;
        this.head_pv[iBand][i].addEq(bp);
        ab += da * 2;
      }
    }

    for (let j = 0; j < nBands; j++) {
      for (let i = 0; i < nBands; i++) {
        const dx = this.head_pv[j][i].sub(this.head_pv[j][(i + 1) % 16]);
        if (j < nBands - 1) {
          const dy2 = this.head_pv[j][i].sub(this.head_pv[j + 1][i]);
          this.head_n0[j][i] = dx.outprod(dy2);
          this.head_n0[j][i].normalize();
        } else {
          // 最終行: 1つ前の行の法線を使用 (C++ではUBで偶然動いていた箇所)
          this.head_n0[j][i] = this.head_n0[j - 1][i].clone();
        }
      }
    }
  }

  private drawHead(pView: BodyView): void {
    const vpv = mk2v(16, 16);
    const n = mk2v(16, 16);
    const spv = mk2p(16, 16);
    const stp: Point = { x: 0, y: 0 };
    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];

    const nBands = 16;

    const vZ = this.mPos[1].vPos.sub(this.mPos[2].vPos).norm();
    const cpH = this.mPos[1].vPos.add(this.mPos[2].vPos).div(2.0);
    let vY = this.mPos[3].vPos.sub(cpH).norm();
    let vZa = vZ.sub(vY.mul(vY.inprod(vZ))); vZa.normalize();
    const vX = vY.outprod(vZa);

    const vXe1 = vX.sub(vZa.mul(this.eye_angle)).norm();
    const vYe = vY.clone();
    const vZe = vZa.clone();

    const l_eye = this.mPos[1].vPos.add(vX.mul(this.eye_gap)).add(vY.mul(0.7)).sub(vZa.mul(this.eye_line));
    this.drawEye(pView, l_eye, vXe1, vYe, vZe, this.eye_size);

    const vXe2 = vX.add(vZa.mul(this.eye_angle)).norm();
    const r_eye = this.mPos[1].vPos.add(vX.mul(-this.eye_gap)).add(vY.mul(0.7)).sub(vZa.mul(this.eye_line));
    this.drawEye(pView, r_eye, vXe2, vYe, vZe, this.eye_size);

    this.drawMouth(pView, this.mPos[1].vPos, vX, vY, vZa, 0.05);

    const p0head = vX.mul(this.head_tp.x).add(vY.mul(this.head_tp.y)).add(vZa.mul(this.head_tp.z));
    const ptp = p0head.add(this.mPos[1].vPos);
    const vtp = new Vector3();
    pView.changeWtoV(ptp, vtp);
    pView.changeVtoS(vtp, stp);

    for (let iBand = 0; iBand < nBands - 1; iBand++) {
      for (let i = 0; i < nBands; i++) {
        const p0 = this.head_pv[iBand][i];
        const p = vX.mul(p0.x).add(vY.mul(p0.y)).add(vZa.mul(p0.z)).add(this.mPos[1].vPos);
        pView.changeWtoV(p, vpv[iBand][i]);
        pView.changeVtoS(vpv[iBand][i], spv[iBand][i]);

        const pn0 = this.head_n0[iBand][i];
        const pn = vX.mul(pn0.x).add(vY.mul(pn0.y)).add(vZa.mul(pn0.z));
        pView.changeWtoV(pn, n[iBand][i]);
      }
    }

    buf[0] = stp; buf[1] = stp;
    const tn0 = new Vector3(0, 0, -1);
    const tn = new Vector3();
    pView.changeWtoV(tn0, tn);

    for (let i = 0; i < nBands; i++) {
      const ni = (i + 1) % nBands;
      if (tn.y < 0 || n[0][i].y < 0 || n[0][ni].y < 0) {
        buf[2] = spv[0][(i + 1) % nBands]; buf[3] = spv[0][i];
        const z = (vtp.y + vpv[0][i].y + vpv[0][(i + 1) % nBands].y) / 3;
        c[0] = c[1] = tn.inprod(this.vLight);
        c[2] = n[0][ni].inprod(this.vLight); c[3] = n[0][i].inprod(this.vLight);
        pView.drawPolygon(buf, 0, c, z, 0);
      }
    }

    for (let j = 0; j < nBands - 2; j++) {
      for (let i = 0; i < nBands; i++) {
        const ni = (i + 1) % nBands;
        if (n[j][i].y < 0 || n[j][ni].y < 0 || n[j + 1][i].y < 0 || n[j + 1][ni].y < 0) {
          buf[0] = spv[j][i]; buf[1] = spv[j][(i + 1) % nBands];
          buf[2] = spv[j + 1][(i + 1) % nBands]; buf[3] = spv[j + 1][i];
          let f = 0;
          if ((n[j][i].y < 0 && n[j][ni].y > 0) || (n[j][i].y > 0 && n[j][ni].y < 0)) f |= 1;
          if ((n[j][i].y < 0 && n[j + 1][i].y > 0) || (n[j][i].y > 0 && n[j + 1][i].y < 0)) f |= 2;
          const z = (vpv[j][i].y + vpv[j][(i + 1) % nBands].y + vpv[j + 1][(i + 1) % nBands].y + vpv[j + 1][i].y) / 4;
          c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
          c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, 0, c, z, f);
        }
      }
    }
  }

  private drawEye(pView: BodyView, pos: Vector3, vX: Vector3, vY: Vector3, vZ: Vector3, r: number): void {
    const vpv = mk2v(16, 16);
    const n = mk2v(16, 16);
    const spv = mk2p(16, 16);

    r *= this.head_r * 0.8;
    const nBands = 12, pBands = 12;

    for (let iBand = 0; iBand < pBands; iBand++) {
      const ri = Math.cos((iBand + 2) * Math.PI / 15) * r;
      const rn = Math.sin((iBand + 2) * Math.PI / 15) * r;
      for (let i = 0; i < nBands; i++) {
        const a = (i + 2) * 2 * Math.PI / nBands / 3;
        const p0 = vX.mul(ri).add(vZ.mul(Math.cos(a) * rn)).add(vY.mul(Math.sin(a) * rn));
        const p = pos.add(p0);
        pView.changeWtoV(p, vpv[iBand][i]);
        pView.changeVtoS(vpv[iBand][i], spv[iBand][i]);
        pView.changeWtoV(p0, n[iBand][i]);
      }
    }

    const tn0 = new Vector3(0, 0, -1);
    const tn = new Vector3();
    pView.changeWtoV(tn0, tn);

    const pY = new Vector3();
    pView.changeWtoV(vY, pY);

    let ecx: number, ecy: number;
    if (this.eye_move) { ecx = 5.5 + pY.z * 4; ecy = 5.5 - pY.x * 4; }
    else { ecx = 5.5; ecy = 5.5; }

    const hcx = 6.5 + pY.z * 4;
    const hcy = 4.5 - pY.x * 4;

    const eh = this.eye_height;
    let eh2 = 5 + eh;
    switch (this.eye_timer) {
      case 1: case 3: eh2 = Math.trunc(eh2 / 2); break;
      case 2: eh2 = 0; break;
    }
    let eh3 = eh2 - 1;
    if (this.double_eyelid) eh3--;

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [-1, -1, -1, -1];

    for (let i = 0; i < nBands - 1; i++) {
      const ni = i + 1;
      for (let j = 0; j < pBands - 1; j++) {
        if (n[j][i].y < 0 || n[j][ni].y < 0 || n[j + 1][i].y < 0 || n[j + 1][ni].y < 0) {
          buf[0] = spv[j][i]; buf[1] = spv[j][i + 1];
          buf[2] = spv[j + 1][i + 1]; buf[3] = spv[j + 1][i];
          const z = (vpv[j][i].y + vpv[j][i + 1].y + vpv[j + 1][i + 1].y + vpv[j + 1][i].y) / 4 - 0.3;

          if (i > 5 - eh && i < eh2) {
            let rr = Math.sqrt((i - ecx) * (i - ecx) * 0.5 + (j - ecy) * (j - ecy) * 1.5);
            c[0] = -1 + rr / this.eye_in_r;
            rr = Math.sqrt(((i + 1) - ecx) * ((i + 1) - ecx) * 0.5 + (j - ecy) * (j - ecy) * 1.5);
            c[1] = -1 + rr / this.eye_in_r;
            rr = Math.sqrt(((i + 1) - ecx) * ((i + 1) - ecx) * 0.5 + ((j + 1) - ecy) * ((j + 1) - ecy) * 1.5);
            c[2] = -1 + rr / this.eye_in_r;
            rr = Math.sqrt((i - ecx) * (i - ecx) * 0.5 + ((j + 1) - ecy) * ((j + 1) - ecy) * 1.5);
            c[3] = -1 + rr / this.eye_in_r;

            rr = Math.sqrt((i - hcx) * (i - hcx) + (j - hcy) * (j - hcy));
            c[0] += this.eye_light_r / rr;
            rr = Math.sqrt(((i + 1) - hcx) * ((i + 1) - hcx) + (j - hcy) * (j - hcy));
            c[1] += this.eye_light_r / rr;
            rr = Math.sqrt(((i + 1) - hcx) * ((i + 1) - hcx) + ((j + 1) - hcy) * ((j + 1) - hcy));
            c[2] += this.eye_light_r / rr;
            rr = Math.sqrt((i - hcx) * (i - hcx) + ((j + 1) - hcy) * ((j + 1) - hcy));
            c[3] += this.eye_light_r / rr;

            if ((i >= eh3 && !this.eye_timer) || i === eh2 - 1) {
              c[0] = -1; c[1] = 1; c[2] = 1; c[3] = -1;
              pView.drawPolygon(buf, 4, c, z, 0);
            } else {
              pView.drawPolygon(buf, 2, c, z, 0);
            }
          } else {
            c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
            c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
            pView.drawPolygon(buf, 0, c, z, 0);
          }
        }
      }
    }
  }

  private drawMouth(pView: BodyView, pos: Vector3, vX: Vector3, vY: Vector3, vZ: Vector3, r: number): void {
    r *= this.head_r;
    const vpv = mk2v(1, 4);
    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [-1, -1, -1, -1];

    let p = pos.add(vY.mul(1.1)).sub(vZ.mul(this.eye_line * 0.4)).add(vX.mul(r));
    pView.changeWtoV(p, vpv[0][0]); pView.changeVtoS(vpv[0][0], buf[0]);

    p = pos.add(vY.mul(1.1)).sub(vZ.mul(this.eye_line * 0.4)).add(vX.mul(-r));
    pView.changeWtoV(p, vpv[0][1]); pView.changeVtoS(vpv[0][1], buf[1]);

    p = pos.add(vY.mul(1.0)).sub(vZ.mul(this.eye_line * (0.4 - r * 0.2))).add(vX.mul(-r * 0.8));
    pView.changeWtoV(p, vpv[0][2]); pView.changeVtoS(vpv[0][2], buf[2]);

    p = pos.add(vY.mul(1.0)).sub(vZ.mul(this.eye_line * (0.4 - r * 0.2))).add(vX.mul(r * 0.8));
    pView.changeWtoV(p, vpv[0][3]); pView.changeVtoS(vpv[0][3], buf[3]);

    const z = (vpv[0][0].y + vpv[0][1].y + vpv[0][2].y + vpv[0][3].y) / 4.0 - 1;
    pView.drawPolygon(buf, 0, c, z, 15);
  }

  private drawHair(pView: BodyView): void {
    const n = Array.from({ length: 2 }, () => mk2v(20, 16));
    const n0 = Array.from({ length: 2 }, () => mk2v(20, 16));
    const l = Array.from({ length: 2 }, () => mk2v(20, 16));
    const s = Array.from({ length: 2 }, () => mk2p(20, 16));

    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 20; j++) {
          pView.changeWtoV(this.hair_p[k][j][i], l[k][j][i]);
          pView.changeVtoS(l[k][j][i], s[k][j][i]);
        }
      }
    }

    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 16; i++) {
        const dx = this.hair_p[0][j][(i + 1) % 16].sub(this.hair_p[0][j][i]);
        const dy = this.hair_p[0][j][i].sub(this.hair_p[0][j + 1][i]);
        n0[0][j][i] = dx.outprod(dy); n0[0][j][i].normalize();
        pView.changeWtoV(n0[0][j][i], n[0][j][i]);
      }
    }
    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 16; i++) {
        const dx = this.hair_p[1][j][i + 1 < 16 ? i + 1 : i].sub(this.hair_p[1][j][i]);
        const dy = this.hair_p[1][j][i].sub(this.hair_p[1][j + 1][i]);
        n0[1][j][i] = dx.outprod(dy); n0[1][j][i].normalize();
        pView.changeWtoV(n0[1][j][i], n[1][j][i]);
      }
    }

    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 16; i++) { n0[k][19][i] = n0[k][18][i].clone(); n[k][19][i] = n[k][18][i].clone(); }
    }
    for (let j = 0; j < 20; j++) { n0[1][j][15] = n0[1][j][14].clone(); n[1][j][15] = n[1][j][14].clone(); }

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];

    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 16; i++) {
        if (this.hair_max[i] > j) {
          const ni = (i + 1) % 16;
          buf[0] = s[0][j][i]; buf[1] = s[0][j][ni]; buf[2] = s[0][j + 1][ni]; buf[3] = s[0][j + 1][i];
          let f = 0;
          if ((n[0][j][i].y < 0 && n[0][j][ni].y > 0) || (n[0][j][i].y > 0 && n[0][j][ni].y < 0)) f |= 1;
          if ((n[0][j][i].y < 0 && n[0][j + 1][i].y > 0) || (n[0][j][i].y > 0 && n[0][j + 1][i].y < 0)) f |= 2;
          const z = (l[0][j][i].y + l[0][j][ni].y + l[0][j + 1][ni].y + l[0][j + 1][i].y) / 4.0;
          c[0] = n[0][j][i].inprod(this.vLight); c[1] = n[0][j][ni].inprod(this.vLight);
          c[2] = n[0][j + 1][ni].inprod(this.vLight); c[3] = n[0][j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, 1, c, z, f);
        }
      }
    }

    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 15; i++) {
        if (this.hair_max2[i] > j) {
          const ni = i + 1;
          buf[0] = s[1][j][i]; buf[1] = s[1][j][ni]; buf[2] = s[1][j + 1][ni]; buf[3] = s[1][j + 1][i];
          let f = 0;
          if ((n[1][j][i].y < 0 && n[1][j][ni].y > 0) || (n[1][j][i].y > 0 && n[1][j][ni].y < 0)) f |= 1;
          if ((n[1][j][i].y < 0 && n[1][j + 1][i].y > 0) || (n[1][j][i].y > 0 && n[1][j + 1][i].y < 0)) f |= 2;
          const z = (l[1][j][i].y + l[1][j][ni].y + l[1][j + 1][ni].y + l[1][j + 1][i].y) / 4.0;
          c[0] = n[1][j][i].inprod(this.vLight); c[1] = n[1][j][ni].inprod(this.vLight);
          c[2] = n[1][j + 1][ni].inprod(this.vLight); c[3] = n[1][j + 1][i].inprod(this.vLight);
          pView.drawPolygon(buf, 1, c, z, 0);
        }
      }
    }
  }

  private moveHair(): void {
    const p = Array.from({ length: 2 }, () => mk2v(20, 16));

    const sint: number[][] = [[], []];
    const cost: number[][] = [[], []];
    for (let i = 0; i < 16; i++) {
      let a = i / 16.0 * Math.PI * 2;
      cost[0].push(Math.cos(a)); sint[0].push(Math.sin(a));
      a = i / 32.0 * Math.PI + Math.PI * 0.75;
      cost[1].push(Math.cos(a)); sint[1].push(Math.sin(a));
    }

    const vZ = this.mPos[1].vPos.sub(this.mPos[2].vPos).norm();
    const cpH = this.mPos[1].vPos.add(this.mPos[2].vPos).div(2.0);
    let vY = cpH.sub(this.mPos[3].vPos).norm();
    let vZa = vZ.sub(vY.mul(vY.inprod(vZ))); vZa.normalize();
    const vX = vY.outprod(vZa);

    let cp = vX.mul(this.head_tp.x).add(vY.mul(this.head_tp.y)).add(vZa.mul(this.head_tp.z));
    cp.addEq(this.mPos[1].vPos);

    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 16; i++) {
        let x = 0, y = 0;
        let vx = k ? this.hair_vx2 : this.hair_vx;
        let vy = k ? this.hair_vy2 : this.hair_vy;
        for (let j = 0; j < 20; j++) {
          p[k][j][i] = cp.add(vZa.mul(y * this.head_r));
          p[k][j][i].addEq(vX.mul(sint[k][i] * x * this.head_r)).addEq(vY.mul(cost[k][i] * x * this.head_r));
          x += vx; y += vy;
          if (k) { vy += this.hair_gy2 + cost[k][i] * this.hair_angle2; vx += this.hair_gx2; }
          else { vy += this.hair_gy + cost[k][i] * this.hair_angle; vx += this.hair_gx; }
        }
      }
    }

    const cpHead = vX.mul(this.head_cp.x).add(vY.mul(this.head_cp.y)).add(vZa.mul(this.head_cp.z));
    cpHead.addEq(this.mPos[1].vPos);

    if (!this.hair_init) {
      for (let k = 0; k < 2; k++)
        for (let i = 0; i < 16; i++)
          for (let j = 0; j < 20; j++)
            this.hair_p[k][j][i] = p[k][j][i].clone();
      this.hair_init = true;
    } else {
      for (let k = 0; k < 2; k++) {
        for (let i = 0; i < 16; i++) {
          for (let j = 0; j < 20; j++) {
            if (!j) {
              this.hair_p[k][j][i] = p[k][j][i].clone();
            } else {
              if (j < 12) {
                this.hair_p[k][j][i] = p[k][j][i].clone();
              } else {
                this.hair_p[k][j][i].z += 1.0;
                const a = (j - 12) / (8.0 + k * 3);
                this.hair_p[k][j][i] = this.hair_p[k][j][i].mul(a).add(p[k][j][i].mul(1 - a));
              }
              const vN = this.hair_p[k][j][i].sub(this.hair_p[k][j - 1][i]).norm();
              const dis = p[k][j][i].sub(p[k][j - 1][i]).abs();
              this.hair_p[k][j][i] = this.hair_p[k][j - 1][i].add(vN.mul(dis));
            }

            const dp = this.hair_p[k][j][i].sub(cpHead);
            const dr = dp.abs();
            if (dr < this.head_r + 0.5) {
              this.hair_p[k][j][i] = cpHead.add(dp.mul((this.head_r + 0.5) / dr));
            }
          }
        }
      }
    }
  }

  private drawSkirt(pView: BodyView): void {
    const n = mk2v(20, 16);
    const n0 = mk2v(20, 16);
    const l = mk2v(20, 16);
    const s = mk2p(20, 16);

    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 20; j++) {
        pView.changeWtoV(this.skirt_p[j][i], l[j][i]);
        pView.changeVtoS(l[j][i], s[j][i]);
      }

    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 16; i++) {
        const dx = this.skirt_p[j][(i + 1) % 16].sub(this.skirt_p[j][i]);
        const dy = this.skirt_p[j][i].sub(this.skirt_p[j + 1][i]);
        n0[j][i] = dx.outprod(dy); n0[j][i].normalize();
        pView.changeWtoV(n0[j][i], n[j][i]);
      }
    }
    for (let i = 0; i < 16; i++) { n0[19][i] = n0[18][i].clone(); n[19][i] = n[18][i].clone(); }

    const buf: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const c: number[] = [0, 0, 0, 0];
    for (let j = 0; j < 19; j++) {
      for (let i = 0; i < 16; i++) {
        const ni = (i + 1) % 16;
        buf[0] = s[j][i]; buf[1] = s[j][ni]; buf[2] = s[j + 1][ni]; buf[3] = s[j + 1][i];
        let f = 0;
        if ((n[j][i].y < 0 && n[j][ni].y > 0) || (n[j][i].y > 0 && n[j][ni].y < 0)) f |= 1;
        if (j === 18 || (n[j][i].y < 0 && n[j + 1][i].y > 0) || (n[j][i].y > 0 && n[j + 1][i].y < 0)) f |= 2;
        const z = (l[j][i].y + l[j][ni].y + l[j + 1][ni].y + l[j + 1][i].y) / 4.0;
        c[0] = n[j][i].inprod(this.vLight); c[1] = n[j][ni].inprod(this.vLight);
        c[2] = n[j + 1][ni].inprod(this.vLight); c[3] = n[j + 1][i].inprod(this.vLight);
        pView.drawPolygon(buf, 3, c, z, f);
      }
    }
  }

  private moveSkirt(center: number, top: number, p0: number, p1: number): void {
    const p = mk2v(20, 16);

    const sint: number[] = [], cost: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16.0 * Math.PI * 2;
      cost.push(Math.cos(a)); sint.push(Math.sin(a));
    }

    const lb = this.mPos[p0].vPos;
    const rb = this.mPos[p1].vPos;
    const lb2 = this.mPos[p0 + 1].vPos;
    const rb2 = this.mPos[p1 + 1].vPos;
    const cp = this.mPos[center].vPos;
    const bcp = lb.add(rb).div(2);
    const bcp2 = lb2.add(rb2).div(2);
    const d = bcp.sub(cp);
    const d2 = bcp2.sub(bcp);
    let dis2 = lb2.sub(rb2).abs2();
    if (dis2 < 40) dis2 = 40;

    const vXb = lb.sub(rb).norm();
    const vZb = d.norm().mul(-1);
    const vYb = vXb.outprod(vZb);
    const vXc = lb2.sub(rb2).norm();
    const vZc = d2.norm().mul(-1);
    const vYc = vXc.outprod(vZc);

    for (let i = 0; i < 16; i++) {
      let x = 1, y = 0, vx = 0.2, vy = -0.4;
      let oy = 0;
      for (let j = 0; j < 20; j++) {
        if (j < 3) {
          p[j][i] = cp.add(vZb.mul(y)).add(vXb.mul(sint[i] * x * 1.4)).add(vYb.mul(cost[i] * x));
        } else if (j < 9) {
          if (j === 3) oy = y;
          const a = (j - 3) / 5.0;
          const vXm = vXb.mul(1 - a).add(vXc.mul(a)).norm();
          const vYm = vYb.mul(1 - a).add(vYc.mul(a)).norm();
          const vZm = vZb.mul(1 - a).add(vZc.mul(a)).norm();
          p[j][i] = cp.add(vZb.mul(y)).mul(1 - a).add(bcp.add(vZc.mul(y - oy)).mul(a));
          p[j][i].addEq(vXm.mul(sint[i] * x * 1.4)).addEq(vYm.mul(cost[i] * x));
        } else {
          const a = (19 - j) / 10.0;
          const b = 1 - a;
          const lb3 = lb.mul(a).add(lb2.mul(b));
          const rb3 = rb.mul(a).add(rb2.mul(b));
          const rr = lb3.sub(rb3).abs() * 0.5 + 2;
          const rx = sint[i] * (x * 1.4 * a + rr * b);
          const ry = cost[i] * (x * a + 3 * b);
          p[j][i] = bcp.add(vZc.mul(y - oy)).add(vXc.mul(rx)).add(vYc.mul(ry));
        }
        vx -= 0.01; x += dis2 / 800.0; y += dis2 / 800.0; x += vx; y += vy;
      }
    }

    if (!this.skirt_init) {
      for (let i = 0; i < 16; i++)
        for (let j = 0; j < 20; j++)
          this.skirt_p[j][i] = p[j][i].clone();
      this.skirt_init = true;
    } else {
      for (let i = 0; i < 16; i++) {
        const am = Math.sin(i / 8.0 * Math.PI);
        const amv = 1 - am * am;
        for (let j = 0; j < 20; j++) {
          let a: number;
          if (j < 18) a = 5.0 / (20 - j) * amv;
          else a = 0.8;
          if (a > 0.8) a = 0.8;
          if (a > j / 10.0) a = j / 10.0;

          this.skirt_p[j][i].z += 1.0;
          this.skirt_p[j][i] = this.skirt_p[j][i].mul(a).add(p[j][i].mul(1 - a));

          if (j > 0) {
            const vN = this.skirt_p[j][i].sub(this.skirt_p[j - 1][i]).norm();
            const dis = p[j][i].sub(p[j - 1][i]).abs();
            this.skirt_p[j][i] = this.skirt_p[j - 1][i].add(vN.mul(dis));
          }
        }
      }
    }
  }

  private calcDis(p0: number, p1: number): number {
    return this.mPos[p0].vInitPos.sub(this.mPos[p1].vInitPos).abs();
  }

  private calcSub(p0: number, p1: number, r: number, t: number): void {
    const d = this.mPos[p0].vPos.sub(this.mPos[p1].vPos);
    const dd = d.abs();
    d.divEq(dd);
    const f = d.mul((r - dd) * t);
    this.mPos[p0].vOldPos.addEq(f);
    this.mPos[p1].vOldPos.subEq(f);
  }

  posCalc(): void {
    const dt = 0.1;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < cPosMax; j++) this.mPos[j].vOldPos = this.mPos[j].vPos.clone();

      this.calcSub(0, 1, this.distance[0], dt);
      this.calcSub(10, 13, this.distance[1], dt);
      this.calcSub(0, 10, this.distance[2], dt);
      this.calcSub(10, 11, this.distance[3], dt);
      this.calcSub(11, 12, this.distance[4], dt);
      this.calcSub(0, 13, this.distance[5], dt);
      this.calcSub(13, 14, this.distance[6], dt);
      this.calcSub(14, 15, this.distance[7], dt);
      this.calcSub(0, 16, this.distance[8], dt);
      this.calcSub(16, 17, this.distance[9], dt);
      this.calcSub(17, 18, this.distance[10], dt);
      this.calcSub(0, 19, this.distance[11], dt);
      this.calcSub(19, 20, this.distance[12], dt);
      this.calcSub(20, 21, this.distance[13], dt);
      this.calcSub(16, 19, this.distance[14], dt);
      this.calcSub(10, 16, this.distance[15], dt);
      this.calcSub(13, 19, this.distance[16], dt);
      this.calcSub(1, 10, this.distance[17], dt);
      this.calcSub(1, 13, this.distance[18], dt);
      this.calcSub(1, 2, this.distance[19], dt);
      this.calcSub(0, 2, this.distance[20], dt);
      this.calcSub(2, 3, this.distance[21], dt);
      this.calcSub(1, 3, this.distance[22], dt);
      this.calcSub(13, 16, this.distance[23], dt);
      this.calcSub(10, 19, this.distance[24], dt);

      for (let j = 0; j < cPosMax; j++) this.mPos[j].vPos = this.mPos[j].vOldPos.clone();
      this.conditionCheck();
    }

    this.moveHair();
    this.moveSkirt(0, 1, 16, 19);

    if (this.wink) {
      if (this.eye_timer) this.eye_timer--;
      else if (Math.random() * 20 < 1) this.eye_timer = 3;
    }
  }

  private conditionCheck(): void {
    const vX = this.mPos[13].vPos.sub(this.mPos[10].vPos).norm();
    const vZ = this.mPos[13].vPos.add(this.mPos[10].vPos).div(2).sub(this.mPos[0].vPos).norm();
    const vY = vX.outprod(vZ);

    const cpHead = this.mPos[1].vPos.add(this.mPos[2].vPos).mul(0.5);
    const dpFace = this.mPos[3].vPos.sub(cpHead);
    const yFace = vY.inprod(dpFace);
    if (yFace > -0.5) {
      this.mPos[3].vPos.subEq(vY.mul(0.1));
      this.mPos[1].vPos.addEq(vY.mul(0.1));
      this.mPos[2].vPos.addEq(vY.mul(0.1));
    }

    const checkArm = (sh: number, el: number, wr: number, sign: number) => {
      let dp = this.mPos[el].vPos.sub(this.mPos[sh].vPos);
      let x = vX.inprod(dp), y = vY.inprod(dp);
      if (y > 0) { this.mPos[sh].vPos.addEq(vY.mul(y * 0.5)); this.mPos[el].vPos.subEq(vY.mul(y * 0.5)); }
      if (x * sign > 0) { this.mPos[sh].vPos.addEq(vX.mul(x * 0.5)); this.mPos[el].vPos.subEq(vX.mul(x * 0.5)); }

      dp = this.mPos[el].vPos.sub(this.mPos[sh].vPos);
      const dp2 = this.mPos[wr].vPos.sub(this.mPos[el].vPos);
      const a0 = dp.norm();
      let a1 = dp.outprod(dp2); a1.normalize();
      const a2 = a0.outprod(a1); a2.normalize();
      if (a1.inprod(vZ) * sign > 0) {
        const aa = a2.inprod(vZ);
        if (aa < -0.5) { this.mPos[el].vPos.subEq(a1.mul(0.1)); this.mPos[wr].vPos.addEq(a1.mul(0.1)); }
        else if (aa > 0.5) { this.mPos[el].vPos.addEq(a1.mul(0.1)); this.mPos[wr].vPos.subEq(a1.mul(0.1)); }
        else { this.mPos[el].vPos.subEq(a2.mul(0.1)); this.mPos[wr].vPos.addEq(a2.mul(0.1)); }
      }
    };

    checkArm(10, 11, 12, 1);
    checkArm(13, 14, 15, -1);

    const vX2 = this.mPos[19].vPos.sub(this.mPos[16].vPos).norm();
    const vZ2 = this.mPos[0].vPos.sub(this.mPos[19].vPos.add(this.mPos[16].vPos).div(2)).norm();
    const vY2 = vX2.outprod(vZ2);

    const checkLeg = (kn1: number, kn2: number, an: number, sign: number) => {
      let dp = this.mPos[kn2].vPos.sub(this.mPos[kn1].vPos);
      let x = vX2.inprod(dp), y = vY2.inprod(dp);
      if (y > 0) { this.mPos[kn1].vPos.addEq(vY2.mul(y * 0.5)); this.mPos[kn2].vPos.subEq(vY2.mul(y * 0.5)); }
      if (x * sign > 0) { this.mPos[kn1].vPos.addEq(vX2.mul(x * 0.5)); this.mPos[kn2].vPos.subEq(vX2.mul(x * 0.5)); }

      dp = this.mPos[kn2].vPos.sub(this.mPos[kn1].vPos);
      const dp2 = this.mPos[an].vPos.sub(this.mPos[kn2].vPos);
      const a0 = dp.norm();
      let a1 = dp.outprod(dp2); a1.normalize();
      const a2 = a0.outprod(a1); a2.normalize();
      if (a1.inprod(vX2) > 0) {
        const aa = a2.inprod(vX2);
        if (aa < -0.5) { this.mPos[kn2].vPos.subEq(a1.mul(0.1)); this.mPos[an].vPos.addEq(a1.mul(0.1)); }
        else if (aa > 0.5) { this.mPos[kn2].vPos.addEq(a1.mul(0.1)); this.mPos[an].vPos.subEq(a1.mul(0.1)); }
        else { this.mPos[kn2].vPos.subEq(a2.mul(0.1)); this.mPos[an].vPos.addEq(a2.mul(0.1)); }
      }
    };

    checkLeg(16, 17, 18, 1);
    checkLeg(19, 20, 21, -1);
  }

  calcScreenDis(pView: BodyView, p0: number, sx: number, sy: number): number {
    const p1 = new Vector3();
    const p2: Point = { x: 0, y: 0 };
    pView.changeWtoV(this.mPos[p0].vPos, p1);
    pView.changeVtoS(p1, p2);
    return Math.sqrt((p2.x - sx) * (p2.x - sx) + (p2.y - sy) * (p2.y - sy));
  }

  inScreenArea(pView: BodyView, no: number, sx: number, sy: number, ex: number, ey: number): boolean {
    const p1 = new Vector3();
    const p2: Point = { x: 0, y: 0 };
    pView.changeWtoV(this.mPos[no].vPos, p1);
    pView.changeVtoS(p1, p2);
    return p2.x > sx && p2.y > sy && p2.x < ex && p2.y < ey;
  }
}
