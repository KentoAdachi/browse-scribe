# SubtitleRepository.kt バックエンドAPI仕様

## バックエンドAPI構成

### 1. **ベースURL**
- **URL**: `https://notegpt.io/`
- [SubtitleRepository.kt:17](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L17)で設定

### 2. **使用しているライブラリ**
- **Retrofit2**: HTTPクライアント
- **Gson**: JSONシリアライゼーション

### 3. **APIエンドポイント**

#### NoteGPT API
```
GET https://notegpt.io/api/v2/video-transcript
```

**目的**:
- YouTube動画の字幕データを取得
- [MainActivity.kt:224](app/src/main/java/com/example/myapplication/MainActivity.kt#L224)で使用

**パラメータ:**
- `platform` (Query): デフォルト `"youtube"`
- `video_id` (Query): YouTube動画ID
- `Cookie` (Header): `"anonymous_user_id=2500e00db502a74d4fd5d1b754d436fe"`

**実装箇所**: [SubtitleApiService.kt:11-16](app/src/main/java/com/example/myapplication/api/SubtitleApiService.kt#L11-L16)

**呼び出し箇所**: [SubtitleRepository.kt:128](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L128)

### 4. **処理フロー**

1. **YouTube URL解析**: [SubtitleRepository.kt:27-48](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L27-L48)
   - 複数のYouTube URLフォーマットから動画IDを抽出
   - 対応フォーマット:
     - `https://www.youtube.com/watch?v=VIDEO_ID`
     - `https://m.youtube.com/watch?v=VIDEO_ID`
     - `https://www.youtube.com/shorts/VIDEO_ID`
     - `https://youtu.be/VIDEO_ID`

2. **API呼び出し**: [SubtitleRepository.kt:124-143](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L124-L143)
   - コルーチン（`withContext(Dispatchers.IO)`）で非同期実行
   - NoteGPT APIを呼び出し
   - エラーログとデバッグログを出力

3. **レスポンス変換**: [SubtitleRepository.kt:81-119](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L81-L119)
   - NoteGPTのレスポンスを内部で使用する形式に変換
   - タイムスタンプ（HH:MM:SS）を秒数に変換
   - トランスクリプト言語の優先順位: default > auto > custom

4. **エラーハンドリング**:
   - APIレスポンスコードが`100000`の場合は成功
   - それ以外のコードまたは例外が発生した場合はエラー
   - すべての結果を`Result<T>`型でラップ

### 5. **使用例**

#### curlでのテスト方法

**基本形式**:
```bash
curl "https://notegpt.io/api/v2/video-transcript?platform=youtube&video_id=VIDEO_ID_HERE" \
  -H "Cookie: anonymous_user_id=2500e00db502a74d4fd5d1b754d436fe"
```

**実際のテスト例**:
```bash
# 動画URL: https://www.youtube.com/watch?v=cCe9MoTRFTQ
curl "https://notegpt.io/api/v2/video-transcript?platform=youtube&video_id=cCe9MoTRFTQ" \
  -H "Cookie: anonymous_user_id=2500e00db502a74d4fd5d1b754d436fe"
```

**レスポンス例（抜粋）**:
```json
{
  "code": 100000,
  "message": "success",
  "data": {
    "videoId": "cCe9MoTRFTQ",
    "videoInfo": {
      "name": "ぶぶか油そばのカップ麺をアレンジしたら...",
      "author": "バキ童チャンネル【ぐんぴぃ】",
      "duration": "1932"
    },
    "language_code": [
      {"code": "ja_auto", "name": "Japanese (auto-generated)"}
    ],
    "transcripts": {
      "ja_auto": {
        "custom": [
          {
            "start": "00:00:00",
            "end": "00:02:05",
            "text": "[音楽] 案件案件です..."
          }
        ]
      }
    }
  }
}
```

#### Kotlinコードでの使用例
```kotlin
val repository = SubtitleRepository()

// YouTube URLから動画IDを抽出
val videoId = repository.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

// 字幕を取得
if (videoId != null) {
    val result = repository.getSubtitles(videoId)
    result.onSuccess { response ->
        // 字幕データを処理
        val snippets = response.transcript.snippets
        snippets.forEach { snippet ->
            println("${snippet.start}s: ${snippet.text}")
        }
    }.onFailure { exception ->
        // エラー処理
        println("Error: ${exception.message}")
    }
}
```

### 6. **レスポンスの扱い方**

#### APIレスポンスの構造（NoteGPT API）

**定義箇所**: [SubtitleModels.kt:4-49](app/src/main/java/com/example/myapplication/data/SubtitleModels.kt#L4-L49)

```kotlin
data class NoteGptResponse(
    val code: Int,              // 100000 = 成功
    val message: String,        // レスポンスメッセージ
    val data: NoteGptData
)

data class NoteGptData(
    val videoId: String,
    val videoInfo: VideoInfo,   // 動画のメタデータ
    val language_code: List<LanguageCode>,
    val transcripts: Map<String, TranscriptLanguage>  // 言語コードをキーとした字幕データ
)

data class TranscriptLanguage(
    val custom: List<TranscriptSegment>? = null,   // カスタム字幕
    val default: List<TranscriptSegment>? = null,  // デフォルト字幕
    val auto: List<TranscriptSegment>? = null      // 自動生成字幕
)

data class TranscriptSegment(
    val start: String,    // 開始時刻（"HH:MM:SS" or "MM:SS"）
    val end: String,      // 終了時刻（"HH:MM:SS" or "MM:SS"）
    val text: String      // 字幕テキスト
)
```

#### アプリ内部で使用する形式（変換後）

**定義箇所**: [SubtitleModels.kt:52-69](app/src/main/java/com/example/myapplication/data/SubtitleModels.kt#L52-L69)

```kotlin
data class TranscriptResponse(
    val status: String,      // "success" or "error"
    val transcript: Transcript
)

data class Transcript(
    val is_generated: Boolean,    // 自動生成字幕かどうか
    val language: String,          // 言語名（例: "Japanese"）
    val language_code: String,     // 言語コード（例: "ja"）
    val snippets: List<Snippet>,   // 字幕スニペットのリスト
    val video_id: String
)

data class Snippet(
    val duration: Double,    // 継続時間（秒単位）
    val start: Double,       // 開始時刻（秒単位）
    val text: String         // 字幕テキスト
)
```

#### レスポンス変換の詳細

**変換処理**: [SubtitleRepository.kt:81-119](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L81-L119)

1. **字幕の優先順位**
   - `default` (デフォルト字幕) → `auto` (自動生成) → `custom` (カスタム)
   - 最初に見つかった字幕を使用

2. **タイムスタンプの変換**
   - APIレスポンス: `"HH:MM:SS"` または `"MM:SS"` 形式の文字列
   - 変換後: 秒単位のDouble型
   - 変換ロジック: [SubtitleRepository.kt:60-76](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L60-L76)

3. **言語情報の抽出**
   - `language_code` リストの最初の要素を使用
   - 言語コードに"auto"が含まれる場合、`is_generated = true`

#### レスポンス例

**APIレスポンス（JSON）**:
```json
{
  "code": 100000,
  "message": "success",
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "language_code": [
      {"code": "ja", "name": "Japanese"}
    ],
    "transcripts": {
      "ja": {
        "default": [
          {"start": "0:00", "end": "0:05", "text": "こんにちは"},
          {"start": "0:05", "end": "0:10", "text": "世界"}
        ]
      }
    },
    "videoInfo": { /* ... */ }
  }
}
```

**変換後（Kotlinオブジェクト）**:
```kotlin
TranscriptResponse(
    status = "success",
    transcript = Transcript(
        is_generated = false,
        language = "Japanese",
        language_code = "ja",
        video_id = "dQw4w9WgXcQ",
        snippets = listOf(
            Snippet(start = 0.0, duration = 5.0, text = "こんにちは"),
            Snippet(start = 5.0, duration = 5.0, text = "世界")
        )
    )
)
```

#### エラーレスポンスの扱い

- **成功条件**: `code == 100000`
- **エラー判定**:
  - `code != 100000`の場合
  - ネットワークエラーや例外が発生した場合
- **エラー処理**: `Result.failure(Exception)`でラップして返す
- **ログ出力**: [SubtitleRepository.kt:135-140](app/src/main/java/com/example/myapplication/repository/SubtitleRepository.kt#L135-L140)

## まとめ

このコードは、NoteGPT APIを使ってYouTube動画の字幕データを取得し、アプリ内で使いやすい形式に変換しています。Retrofit2を使った標準的なREST API実装で、エラーハンドリングとログ出力も適切に行われています。
