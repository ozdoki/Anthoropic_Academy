import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MainContent } from "@/app/main-content";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock contexts
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(() => ({
    fileSystem: null,
    refreshTrigger: 0,
    selectedFile: null,
    setSelectedFile: vi.fn(),
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

// Mock child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

// Mock resizable panels
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("renders preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("renders Preview and Code tab buttons", () => {
  render(<MainContent />);

  const buttons = screen.getAllByRole("button");
  const previewBtn = buttons.find((b) => b.textContent === "Preview");
  const codeBtn = buttons.find((b) => b.textContent === "Code");

  expect(previewBtn).toBeDefined();
  expect(codeBtn).toBeDefined();
});

test("switches to code view when Code button is clicked", () => {
  render(<MainContent />);

  // Initially shows preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Click Code button
  const buttons = screen.getAllByRole("button");
  const codeBtn = buttons.find((b) => b.textContent === "Code")!;
  fireEvent.click(codeBtn);

  // Now shows code editor and file tree
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("switches back to preview view when Preview button is clicked", () => {
  render(<MainContent />);

  const buttons = screen.getAllByRole("button");
  const codeBtn = buttons.find((b) => b.textContent === "Code")!;
  const previewBtn = buttons.find((b) => b.textContent === "Preview")!;

  // Switch to code view first
  fireEvent.click(codeBtn);
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  fireEvent.click(previewBtn);

  // Should show preview again
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});
