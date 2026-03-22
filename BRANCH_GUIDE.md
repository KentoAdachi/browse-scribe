# Branch Management Guide

## 新しいブランチの作成方法 (How to Create New Branches)

このプロジェクトでは、以下のブランチ命名規則に従って新しいブランチを作成してください。

### ブランチ命名規則 (Branch Naming Convention)

- **feature/**: 新機能の開発
  - 例: `feature/i18n-support`, `feature/dark-mode`, `feature/export-notes`
  
- **fix/**: バグ修正
  - 例: `fix/youtube-transcript-loading`, `fix/note-save-issue`
  
- **improvement/**: 既存機能の改善
  - 例: `improvement/ui-responsiveness`, `improvement/performance`
  
- **docs/**: ドキュメントの更新
  - 例: `docs/api-reference`, `docs/setup-guide`

### ブランチ作成手順 (Branch Creation Steps)

1. メインブランチから最新の状態を取得:
   ```bash
   git checkout main
   git pull origin main
   ```

2. 新しいブランチを作成:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. 作業を開始し、定期的にコミット:
   ```bash
   git add .
   git commit -m "feat: add initial implementation"
   ```

4. リモートにプッシュ:
   ```bash
   git push -u origin feature/your-feature-name
   ```

### 現在の開発ブランチ (Current Development Branches)

- `feature/i18n-support`: 国際化対応の実装
  - 多言語サポート（日本語・英語）
  - 翻訳ファイルの整備
  - UIコンポーネントの国際化対応

### 開発ワークフロー (Development Workflow)

1. 新機能やバグ修正のために新しいブランチを作成
2. 機能の実装とテスト
3. プルリクエストの作成
4. コードレビュー
5. メインブランチへのマージ

### 注意事項 (Important Notes)

- ブランチ名は英語で記述してください
- 説明的で理解しやすい名前を使用してください
- 一つのブランチでは一つの機能に集中してください
- 定期的にメインブランチから最新の変更を取り込んでください