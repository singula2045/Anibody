import { BodyView } from './BodyView';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const view = new BodyView(canvas);

function loop() {
  view.idle();
  view.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
