// App.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";
import { useNotes } from "../sidepanel/hooks/useNotes";
import { useTabs } from "../sidepanel/hooks/useTabs";
import { NoteEditor } from "../sidepanel/components/NoteEditor";
import { NotesList } from "../sidepanel/components/NotesList";

function App() {
  const [showNotesList, setShowNotesList] = useState(false);
  const [autoEdit, setAutoEdit] = useState(false);

  // --- notes フック初期化 ---
  const {
    note,
    title,
    lastUpdated,
    allNotes,
    loadNote,
    loadAllNotes,
    saveNote,
    deleteNote,
  } = useNotes();

  // --- URL 変化時のハンドラ ---
  const handleUrlChange = useCallback(
    (url: string, pageTitle: string) => {
      loadNote(url);
    },
    [loadNote]
  );

  const isFirstRender = useRef(true); // 初回レンダリングかどうか
  // note がロードされてきたら次のフレームで自動編集開始
  useEffect(() => {
    if (!autoEdit) {
      // 50 ms 遅延させてチラつきを抑える
      setTimeout(() => setAutoEdit(true), 50);
    }
  }, [note]); // note が変わったら再評価

  // --- tabs フック初期化 ---
  const { currentUrl, currentTitle, navigateToUrl } = useTabs(handleUrlChange);

  // --- ノート変更時の保存 ---
  const handleNoteChange = (content: string): void => {
    saveNote(currentUrl, content, currentTitle);
  };

  // --- ノート一覧で項目クリック → その URL へ遷移 ---
  const handleNoteClick = (url: string) => {
    navigateToUrl(url);
    setShowNotesList(false); // 一覧からノートビューに戻る
  };

  // --- ノート削除 ---
  const handleDeleteNote = async (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // navigateToUrl を抑止
    await deleteNote(url);

    // 表示中のノートを削除した場合は再読込して空にする
    if (url === currentUrl) {
      loadNote(currentUrl);
    }
  };

  // --- ノートビュー ⇆ 一覧ビュー 切り替え ---
  const toggleView = () => {
    setShowNotesList(!showNotesList);
    if (!showNotesList) {
      loadAllNotes(); // 一覧表示時に最新化
    }
  };

  return (
    <div className="note-container popup-container">
      <div className="header">
        <h1>{title || "BrowseScribe"}</h1>
        <button onClick={toggleView} className="toggle-button">
          {showNotesList ? "Current Note" : "All Notes"}
        </button>
      </div>

      {showNotesList ? (
        <NotesList
          notes={allNotes}
          onNoteClick={handleNoteClick}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <NoteEditor
          note={note}
          lastUpdated={lastUpdated}
          onNoteChange={handleNoteChange}
          autoEdit={autoEdit}
        />
      )}
    </div>
  );
}

export default App;
