import {
  component$,
  useSignal,
  useTask$,
  $,
  useStore,
} from "@builder.io/qwik";

/**
 * MainContainer for NoteEase: Handles display and management of notes.
 * Features:
 *  - Create, edit, delete notes
 *  - Search notes by title/content
 *  - Categorize notes by tags
 *  - Core UI layout as per design
 */

// Type for a note object
type Note = {
  id: string;
  title: string;
  content: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
};

// Colors and palette for NoteEase (passed via CSS, but also referenced here for labels etc.)
const COLOR_PALETTE = {
  primary: "#4A90E2",
  secondary: "#FFFFFF",
  accent: "#F5A623",
};

// Public categories for user selection (expand as needed)
const DEFAULT_CATEGORIES = [
  "Work",
  "Personal",
  "Ideas",
  "Important",
  "Todo",
  "Other",
];

// Utility: generate random id
const genId = () => Math.random().toString(36).substring(2, 12);

/**
 * MainContainer Qwik component
 */
// PUBLIC_INTERFACE
export default component$(() => {
  // Notes state
  const notes = useStore<{ all: Note[] }>({
    all: [
      {
        id: genId(),
        title: "Welcome to NoteEase!",
        content:
          "Get started by creating, editing, searching, and organizing your notes.",
        categories: ["Personal", "Ideas"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  // UI states
  const searchTerm = useSignal("");
  const showModal = useSignal(false);
  const modalMode = useSignal<"create" | "edit">("create");
  const modalNote = useStore<Partial<Note>>({});

  // Filtered list based on search
  const filteredNotes = useSignal<Note[]>([]);

  // Load filtered notes when notes or searchTerm changes
  useTask$(() => {
    const term = searchTerm.value.trim().toLowerCase();
    let filtered = [...notes.all];
    if (term) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.content.toLowerCase().includes(term)
      );
    }
    filteredNotes.value = filtered;
  });

  // ---- ACTIONS ----

  // Create new note
  // PUBLIC_INTERFACE
  const openCreateModal = $(() => {
    modalMode.value = "create";
    modalNote.id = "";
    modalNote.title = "";
    modalNote.content = "";
    modalNote.categories = [];
    showModal.value = true;
  });

  // PUBLIC_INTERFACE
  const openEditModal = $((note: Note) => {
    modalMode.value = "edit";
    modalNote.id = note.id;
    modalNote.title = note.title;
    modalNote.content = note.content;
    modalNote.categories = [...note.categories];
    showModal.value = true;
  });

  // PUBLIC_INTERFACE
  const closeModal = $(() => {
    showModal.value = false;
  });

  // PUBLIC_INTERFACE
  const saveNote = $(() => {
    const now = new Date().toISOString();
    if (modalMode.value === "create") {
      // Add
      const newNote: Note = {
        id: genId(),
        title: modalNote.title?.trim() || "",
        content: modalNote.content?.trim() || "",
        categories: modalNote.categories?.length
          ? modalNote.categories.slice()
          : [],
        createdAt: now,
        updatedAt: now,
      };
      if (newNote.title) {
        notes.all = [newNote, ...notes.all];
      }
    } else if (modalMode.value === "edit" && modalNote.id) {
      // Edit
      notes.all = notes.all.map((n) =>
        n.id === modalNote.id
          ? {
              ...n,
              title: modalNote.title?.trim() || "",
              content: modalNote.content?.trim() || "",
              categories: modalNote.categories?.length
                ? modalNote.categories.slice()
                : [],
              updatedAt: now,
            }
          : n
      );
    }
    showModal.value = false;
  });

  // PUBLIC_INTERFACE
  const deleteNote = $((id: string) => {
    notes.all = notes.all.filter((n) => n.id !== id);
    // In case modal was open for this note, close.
    if (modalNote.id === id) showModal.value = false;
  });

  // PUBLIC_INTERFACE
  const handleCategoryToggle = $((cat: string) => {
    if (!modalNote.categories) modalNote.categories = [];
    if (modalNote.categories.includes(cat)) {
      modalNote.categories = modalNote.categories.filter((c) => c !== cat);
    } else {
      modalNote.categories = [...modalNote.categories, cat];
    }
  });

  // PUBLIC_INTERFACE
  const handleSearchInput = $((e: Event) => {
    searchTerm.value = (e.target as HTMLInputElement).value;
  });

  // ---- UI helpers ----
  // PUBLIC_INTERFACE
  const snippet = (content: string, max = 80) => {
    if (!content) return "";
    return content.length > max ? content.slice(0, max) + "..." : content;
  };

  // PUBLIC_INTERFACE
  const getCategoryColor = (category: string) => {
    // Deterministically assign color (simple hash)
    const hash =
      category
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3;
    if (hash === 0) return COLOR_PALETTE.primary;
    if (hash === 1) return COLOR_PALETTE.accent;
    return "#7ED957"; // a green accent for variety
  };

  // ---- RENDER ----

  return (
    <div
      style={{
        background: COLOR_PALETTE.secondary,
        minHeight: "100vh",
        padding: "0",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {/* App Header */}
      <header
        style={{
          background: COLOR_PALETTE.primary,
          color: "#fff",
          padding: "1.5rem 1.5rem 1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: "2.1rem" }}>
          NoteEase
        </h1>
        {/* Could add logo or user avatar here */}
      </header>

      {/* Search Bar */}
      <div
        style={{
          background: "#f3f6fa",
          padding: "1rem 1.5rem",
          boxShadow: "0 2px 10px #eaeaea1a",
        }}
      >
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm.value}
          onInput$={handleSearchInput}
          style={{
            width: "100%",
            padding: "0.75rem 1.2rem",
            border: `1.5px solid ${COLOR_PALETTE.primary}`,
            borderRadius: "10px",
            fontSize: "1.06rem",
            outline: "none",
            transition: "box-shadow 0.1s",
            background: "white",
          }}
        />
      </div>

      {/* Category Filter Bar, Optional (future: filter by, now just show categories) */}
      <div
        style={{
          padding: "0.7rem 1.5rem 0.2rem 1.5rem",
          background: "#fbfbfb",
        }}
      >
        <span style={{ fontWeight: 600, marginRight: "0.7rem" }}>
          Categories:
        </span>
        {DEFAULT_CATEGORIES.map((cat) => (
          <span
            key={cat}
            style={{
              background: getCategoryColor(cat),
              color: "#fff",
              borderRadius: "14px",
              padding: "0.3em 0.8em",
              marginRight: "0.5em",
              fontSize: "0.92em",
              fontWeight: 600,
              verticalAlign: "middle",
              userSelect: "none",
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Notes List */}
      <div
        style={{
          padding: "1.5rem",
          maxWidth: 750,
          margin: "0 auto",
          marginBottom: "9rem",
        }}
      >
        {filteredNotes.value.length === 0 ? (
          <div
            style={{
              color: COLOR_PALETTE.primary,
              textAlign: "center",
              marginTop: "3rem",
              fontSize: "1.15rem",
              opacity: 0.75,
            }}
          >
            No notes found. Try creating one!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
            {filteredNotes.value.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 3px 16px #cfdff441",
                  border: `1.5px solid ${COLOR_PALETTE.primary}11`,
                  padding: "1.3rem 1.2rem 1.1rem 1.3rem",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, border 0.15s;",
                  position: "relative",
                  minHeight: "86px",
                }}
                onClick$={() => openEditModal(n)}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    color: "#282b38",
                    marginBottom: "0.22em",
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    color: "#50576a",
                    fontSize: "1rem",
                    marginBottom: "0.7em",
                  }}
                >
                  {snippet(n.content)}
                </div>
                <div>
                  {n.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        background: getCategoryColor(cat),
                        color: "#fff",
                        borderRadius: "12px",
                        padding: "0.2em 0.7em",
                        marginRight: "0.33em",
                        fontSize: "0.93em",
                        verticalAlign: "middle",
                        fontWeight: 500,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                {/* Delete icon, appears on hover or always at top right */}
                <button
                  type="button"
                  onClick$={async (ev) => {
                    ev.stopPropagation();
                    if (
                      window.confirm("Delete this note? This cannot be undone.")
                    ) {
                      await deleteNote(n.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 15,
                    background: "#ff5555",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1.12rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px #ef47471a",
                    outline: "none",
                    transition: "background 0.14s",
                  }}
                  title="Delete note"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (add note) */}
      <button
        type="button"
        title="Add a note"
        onClick$={openCreateModal}
        style={{
          position: "fixed",
          right: "2.3rem",
          bottom: "2.5rem",
          zIndex: 12,
          background: COLOR_PALETTE.primary,
          color: "#fff",
          width: "62px",
          height: "62px",
          borderRadius: "50%",
          border: "none",
          boxShadow: "0 4px 20px #4A90E288",
          fontWeight: 800,
          fontSize: "2.39rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 0.13s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>

      {/* Modal for create/edit note */}
      {showModal.value && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 200,
            background: "#0002",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick$={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: "2.2rem 2rem 1.4rem 2rem",
              borderRadius: "27px",
              boxShadow: "0 8px 42px #2f447044",
              width: "96vw",
              maxWidth: "428px",
              position: "relative",
            }}
            onClick$={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: "1.39rem",
                fontWeight: 700,
                color: COLOR_PALETTE.primary,
                marginBottom: "0.8rem",
                textAlign: "center",
              }}
            >
              {modalMode.value === "create" ? "Create Note" : "Edit Note"}
            </div>
            {/* Note form */}
            <form
              preventdefault:submit
              onSubmit$={async (e) => {
                e.preventDefault();
                if (!modalNote.title?.trim()) {
                  alert("Note title required!");
                  return;
                }
                await saveNote();
              }}
            >
              <input
                type="text"
                placeholder="Title"
                required
                maxLength={60}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  marginBottom: "1.1rem",
                  border: `1.5px solid ${COLOR_PALETTE.primary}`,
                  fontSize: "1.1rem",
                  borderRadius: "8px",
                  outline: "none",
                  fontWeight: 600,
                  background: "#f9fbff",
                }}
                value={modalNote.title}
                onInput$={(e) =>
                  (modalNote.title = (e.target as HTMLInputElement).value)
                }
                autoFocus
              />
              <textarea
                placeholder="Write your note here..."
                maxLength={1000}
                required
                style={{
                  width: "100%",
                  minHeight: "96px",
                  padding: "0.68rem",
                  marginBottom: "1.1rem",
                  border: `1.5px solid ${COLOR_PALETTE.primary}`,
                  borderRadius: "8px",
                  fontSize: "1.09rem",
                  background: "#f9fbff",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                value={modalNote.content}
                onInput$={(e) =>
                  (modalNote.content = (e.target as HTMLTextAreaElement).value)
                }
              ></textarea>

              {/* Categories */}
              <div style={{ marginBottom: "1.4rem" }}>
                <div
                  style={{
                    marginBottom: "0.47em",
                    fontWeight: 600,
                    fontSize: "1em",
                    color: "#576392",
                  }}
                >
                  Categories:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4em" }}>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      style={{
                        background: modalNote.categories?.includes(cat)
                          ? getCategoryColor(cat)
                          : "#e9eaea",
                        color: modalNote.categories?.includes(cat)
                          ? "#fff"
                          : "#444",
                        borderRadius: "11px",
                        padding: "0.28em 0.93em",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "0.96em",
                        marginRight: "0.12em",
                        transition: "background 0.12s",
                        minWidth: "60px",
                        textAlign: "center",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!modalNote.categories?.includes(cat)}
                        style={{ marginRight: "0.4em", accentColor: getCategoryColor(cat) }}
                        onChange$={() => handleCategoryToggle(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1.05rem",
                }}
              >
                <button
                  type="button"
                  onClick$={closeModal}
                  style={{
                    background: "#f4f4f4",
                    color: "#2e374f",
                    border: `1px solid #e0e8f4`,
                    borderRadius: "8px",
                    padding: "0.63em 1.2em",
                    fontWeight: 500,
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: COLOR_PALETTE.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.63em 1.2em",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  {modalMode.value === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>

            {/* Close modal button (X) */}
            <button
              type="button"
              title="Close"
              onClick$={closeModal}
              style={{
                position: "absolute",
                top: 11,
                right: 9,
                background: "none",
                border: "none",
                color: COLOR_PALETTE.primary,
                fontSize: "2.01rem",
                cursor: "pointer",
                fontWeight: 600,
                outline: "none",
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
