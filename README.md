# BrowseScribe

![ブラウズスクライブ](https://github.com/user-attachments/assets/0ec1aacf-91f1-4363-b06d-aac953585b00)


ブラウザのサイドパネルに **ページ URL ごとに Markdown メモ** を保存できる、Chrome / Firefox (Manifest V3) 拡張機能です。  
YouTube 動画を開くと自動で字幕情報を取得し、ワンクリックで要約をメモに貼り付けることができます。  
キーボードショートカット **`Alt+M`**（デフォルト）でサイドパネルをすばやく開閉できます。

スクリーンショット
| 動画の概要を素早く把握 | 全画面表示も可能 |
| ---- | ---- |
| ![image](https://github.com/user-attachments/assets/956d9576-e453-4e3b-b088-90236e74285e) | ![image](https://github.com/user-attachments/assets/beded390-99b0-4a76-89ff-a2e3cf30f44e) |






---

## 主な機能

| 機能 | 説明 |
|------|------|
| ページ別メモ保存 | URL をキーに自動でメモをひも付け。ページを再訪するとサイドパネルにメモを表示。 |
| Markdown サポート | フォーカス時はプレーンテキスト、フォーカスを外すとリアルタイムプレビュー。 |
| メモ一覧 | すべての保存メモを一覧表示。クリックで対象ページにジャンプ、ゴミ箱アイコンで削除。 |
| YouTube 字幕取得 | `youtube-transcript-plus` でキャプション取得（日本語優先）。 |
| GPT で要約 | OpenAI API キーとモデルを設定すると、動画キャプションを日本語 Markdown で要約しメモに追加。 |

---

## インストール

1. Releaseから[zip](https://github.com/KentoAdachi/browse-scribe/releases/download/v0.0.1/browse-scribe-0.0.1-chrome.zip)をダウンロードして解凍
2. ブラウザの `chrome://extensions` → 「デベロッパーモード ON」 → 「パッケージ化されていない拡張機能を読み込む」で 解凍したフォルダを選択
3. `alt+m` でサイドパネルを開く
   - サイドパネルが開かない場合は、拡張機能のアイコン横の三点リーダーをクリックしてみてください。
4. サイドパネル右上の ⚙️ Settings をクリック
   - API Key: OpenAI API キーを入力
   - Base URL: `https://api.openai.com/v1` (互換サーバーを使用する場合は変更)
   - Model: 使用するモデル(デフォルト: `gpt-4.1-nano`)

## 開発

ホットリロード付きローカル開発サーバーを起動:

```
pnpm dev
```

---

## ディレクトリ構成（抜粋）

```
entrypoints/
 ├─ background.ts           # バックグラウンド&サービスワーカー
 ├─ content.ts              # （将来用）コンテントスクリプト
 ├─ popup/                  # ポップアップ UI（未使用）
 └─ sidepanel/              # サイドパネル React アプリ
     ├─ hooks/              # React hooks（メモ管理・タブ追跡・API設定）
     ├─ components/         # UI コンポーネント
     │   ├─ NoteEditor.tsx  # Markdown エディタ
     │   ├─ YoutubeTranscript.tsx  # トランスクリプト取得＆要約
     │   └─ Settings/       # 設定ダイアログ
     └─ App.tsx             # ルートコンポーネント
wxt.config.ts               # WXT ビルド&ランナー設定
```

---

## 依存技術

- [React 19](https://react.dev/)
- [WXT](https://wxt.dev/) – Manifest V3 向けビルドツール
- [youtube-transcript-plus](https://www.npmjs.com/package/youtube-transcript-plus)
- [OpenAI JS SDK](https://github.com/openai/openai-node)

---

## キーボードショートカット

| アクション | キー |
|------------|------|
| 拡張機能を有効化(ポップアップメニューを開く) | 割り当てなし |
| サイドパネルを開く | `Alt + M` |

（`chrome://extensions/shortcuts` で変更可）

ポップアップメニューは開くと自動でフォーカスが当たるため、ショートカットから呼び出すことで手軽にメモを取ることができます。
