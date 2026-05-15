import { actionUpdateDoc } from "@/atoms/firestore.action";
import { monacoDataErrorAtom } from "@/atoms/ui";
import { appThemeAtom } from "@/atoms/ui.action";
import { ClientDocumentSnapshot } from "@/types/ClientDocumentSnapshot";
import {
  addFirebaseDocSerializeMetaData,
  removeFirebaseSerializeMetaData,
} from "@/utils/common";
import {
  displayifyTimestamps,
  restoreTimestamps,
} from "@/utils/timestampDisplay";
import Editor, { Monaco, OnValidate, useMonaco } from "@monaco-editor/react";
import { diff } from "deep-diff";
import firebase from "firebase/app";
import {
  deserializeDocumentSnapshot,
  serializeDocumentSnapshot,
  DocRef,
} from "firestore-serializers";
import { debounce } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import "./monaco.css";

interface IMonacoPropertyProps {
  doc: ClientDocumentSnapshot;
}

const monacoOption = {
  lineNumbersMinChars: 3,
  // lineNumbers: "off",
  minimap: {
    enabled: false,
  },
  folding: true,
  tabSize: 2,
  formatOnPaste: true,
  autoIndent: "full",
  scrollbar: {
    horizontalScrollbarSize: 5,
    verticalScrollbarSize: 5,
  },
  wordWrap: "bounded",
  theme: "monacoProperty-light",
  padding: {
    top: 0,
    bottom: 0,
  },
  "semanticHighlighting.enabled": true,
};

const serializeData = (doc: ClientDocumentSnapshot) => {
  return displayifyTimestamps(
    removeFirebaseSerializeMetaData(
      JSON.stringify(JSON.parse(serializeDocumentSnapshot(doc)))
    )
  );
};

class TimestampParseError extends Error {}

const deserializeData = (
  originalDoc: ClientDocumentSnapshot,
  data: string
): ClientDocumentSnapshot => {
  const restored = restoreTimestamps(data);
  if (restored.error) {
    throw new TimestampParseError(restored.error);
  }
  return originalDoc.clone(
    deserializeDocumentSnapshot(
      addFirebaseDocSerializeMetaData(
        restored.result,
        originalDoc.id,
        originalDoc.ref.path
      ),
      firebase.firestore.GeoPoint,
      firebase.firestore.Timestamp,
      (path) => new DocRef(path)
    ).data()
  );
};

const MonacoProperty = ({ doc }: IMonacoPropertyProps) => {
  const initialSerialized = serializeData(doc);
  const [defaultValue, setDefaultValue] = useState<string | undefined>(
    initialSerialized
  );
  // Tracks the last string we rendered into the editor from `doc`. We use it
  // to short-circuit `commitChange` when Monaco fires `onValidate` for a
  // value that we put there ourselves (e.g. on mount or after an external
  // doc sync). Without this, the validate-on-mount pass would re-deserialize
  // and diff against `doc.data()`, and small lossy round-trips (notably the
  // truncation from Firestore Timestamp nanoseconds to JS Date milliseconds)
  // would falsely mark the document as changed.
  const lastSerializedRef = useRef<string | undefined>(initialSerialized);
  const editorView = useRef<any>();
  const setError = useSetRecoilState(monacoDataErrorAtom(doc.ref.path));
  const appTheme = useRecoilValue(appThemeAtom);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.onDidCreateEditor((view) => {
        editorView.current = view;
      });
    }
  }, [monaco]);

  useEffect(() => {
    if (editorView.current) {
      editorView.current.setScrollTop(0);
    }
  }, [doc.ref.path]);

  useEffect(() => {
    // If user is editing on monaco editor. Do not sync outside value to it
    // TODO: Check if new version of monaco change this div className
    if (
      !document.activeElement?.classList.contains("monaco-mouse-cursor-text")
    ) {
      const next = serializeData(doc);
      lastSerializedRef.current = next;
      setDefaultValue(next);
    }
  }, [doc]);

  const handleEditorValidation: OnValidate = (markers) => {
    if (markers.length === 0) {
      setError("");
      commitChange(defaultValue);
    }

    if (markers[0]) {
      // Only track the 1st error 1st
      setError(`Line ${markers[0].startLineNumber}: ${markers[0].message}`);
    }
  };

  const commitChange = debounce((docStr?: string) => {
    if (!docStr) {
      setError("Can not parse data from JSON");
      return;
    }

    // No-op when the editor's value is byte-identical to whatever we last
    // rendered from `doc`. Prevents the mount-time / sync-time validation
    // pass from marking the document dirty via the lossy
    // Timestamp -> ISO -> Timestamp round-trip.
    if (docStr === lastSerializedRef.current) {
      setError("");
      return;
    }

    try {
      JSON.parse(docStr);
    } catch (error) {
      setError("Can not parse data from JSON");
      return;
    }

    setError("");
    try {
      const newDoc = deserializeData(doc, docStr);
      const changes = diff(doc.data(), newDoc.data()) || [];
      if (changes.length > 0) {
        const fieldChanges = changes
          .map((change) => change.path?.join("."))
          .filter((_) => _) as string[];

        newDoc.addChange(fieldChanges);
        actionUpdateDoc(newDoc);
      }
    } catch (error) {
      if (error instanceof TimestampParseError) {
        setError(error.message);
        return;
      }
      console.log(error);
    }
  }, 300);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0 border border-border">
        <Editor
          defaultLanguage="json"
          value={defaultValue}
          height="100%"
          theme={appTheme ? "monacoProperty-light" : "monacoProperty-dark"}
          onChange={setDefaultValue}
          onValidate={handleEditorValidation}
          options={monacoOption as any}
          line={1}
        />
      </div>
      <MonacoPropertyError path={doc.ref.path} />
    </div>
  );
};

export const MonacoPropertyError = ({ path }: { path: string }) => {
  const error = useRecoilValue(monacoDataErrorAtom(path));

  return (
    <div
      className="p-1 text-xs text-destructive truncate border-b border-l border-r border-border"
      style={{ minHeight: "1.5rem" }}
    >
      {error}
    </div>
  );
};

export default MonacoProperty;
