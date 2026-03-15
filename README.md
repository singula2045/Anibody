# AnimeBody

リアルタイムのアニメ風（セルシェーディング）3D人体モデルレンダラー。オリジナル版は1999年に金子勇氏によりVisual C++、MFC、DirectX5を使用して開発された。本プログラムは金子氏により公開されたAnimeBody for X-Window Ver 1.0をベースとし、TypeScriptにコンバートしたものである。コンバートはClaude Codeを使用して行った。

## Commands

```bash
npm install      # 依存パッケージのインストール
npm run dev      # Vite 開発サーバー起動 → http://localhost:5173
npm run build    # 本番ビルド (dist/ に出力)
npm run preview  # ビルド成果物のプレビューサーバー
```

TypeScript の型チェックのみ実行:
```bash
npx tsc --noEmit
```

## Architecture

C++ & X-Window/Xlib で書かれたアニメ調人体3D表示プログラムを TypeScript + HTML Canvas 2D API に変換したもの。オリジナルは cpp-original に保存されている。 

### ファイル構成

| ファイル | 役割 |
|---|---|
| `src/Body.ts` | 定数・型定義。`CANVAS_WIDTH/HEIGHT=400`, `Q=100`, `COLORS[5][4]`（アニメ塗り色テーブル）|
| `src/Vector3.ts` | 3D ベクトルクラス (`CVector3` の変換) |
| `src/BodyModel.ts` | 人体メッシュ生成・物理演算・ポリゴン発行 |
| `src/BodyView.ts` | Canvas 描画・Z ソート・アニメポリゴン塗り・イベント処理 |
| `src/main.ts` | エントリーポイント。`requestAnimationFrame` ループ |

### 描画パイプライン

1. `BodyModel` が各フレームで頭・胴・四肢のポリゴンを `PolyBuffer[]` に積む
2. `BodyView.flushPolyBuffer()` が Z 値で降順ソート（ペインタアルゴリズム）
3. エッジ（輪郭線）→ 塗りつぶしポリゴンの順で描画
4. `drawAnimePolygon()` が明るさ閾値 `T1/T2/T3` で色域を分割して塗る

### 座標変換

`changeVtoS()` がビュー座標 → スクリーン座標に変換:
```typescript
sScreenPos.x = Math.trunc((vViewPos.x - camera_pos.x) * Q / z + 200);
sScreenPos.y = Math.trunc((vViewPos.z - camera_pos.z) * Q / z + 150);
```
画面サイズを変更する場合は `Body.ts` の `Q` と `changeVtoS` のオフセット (+200/+150) も合わせて変更すること。

### 既知の移植上の注意点

- C++ 版 `createHead()` は `head_pv[16][16]` を `head_pv[j+1]` が `j=15` で範囲外アクセスしていた (UB)。TypeScript 版では最終行は 1 行前の法線をコピーして回避している。
- C++ の構造体コピー意味論はオブジェクトリテラル `{x, y}` / `.clone()` で再現している。
