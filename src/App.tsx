import React, { useEffect, useState, useRef } from "react";
import { BlogPost } from "./types/BlogPost";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all blog posts
  const fetchPosts = async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => {
      const raw = doc.data();
      return {
        id: doc.id,
        title: raw.title,
        content: raw.content,
        createdAt: raw.createdAt?.toDate() ?? new Date(), // ✅ convert to Date
      };
    }) as BlogPost[];

    setPosts(data); // ✅ FIX: update state
  };

  // Create a new post
  const createPost = async () => {
    if (!title || !content) return alert("Title and content are required.");
    await addDoc(collection(db, "posts"), {
      title,
      content,
      createdAt: Timestamp.now().toDate(),
    });
    setTitle("");
    setContent("");
    fetchPosts();
  };

  // Delete a post
  const deletePost = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    fetchPosts();
  };

  // Export markdown as a .md file
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title || "blogpost"}.md`;
    link.click();
  };

  // Import markdown from a .md file
  const importMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContent(reader.result as string);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="app">
      <h1>📘 Markdown Blog</h1>

      <input
        type="text"
        placeholder="Blog title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Write your content in markdown..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>

      <div className="buttons">
        <button onClick={createPost}>📤 Publish</button>
        <button onClick={exportMarkdown}>📥 Export .md</button>
        <button onClick={() => fileInputRef.current?.click()}>
          📂 Import .md
        </button>
        <input
          type="file"
          accept=".md"
          ref={fileInputRef}
          onChange={importMarkdown}
          hidden
        />
      </div>

      <hr />

      <h2>📝 Blog Posts</h2>
      {posts.map((post) => (
        <div key={post.id} className="post">
          <div className="post-header">
            <h3>{post.title}</h3>
            <button className="delete" onClick={() => deletePost(post.id!)}>
              🗑️ Delete
            </button>
          </div>
          <ReactMarkdown>{post.content}</ReactMarkdown>
          <p>
            <em>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleString()
                : "No date"}
            </em>
          </p>

          <hr />
        </div>
      ))}
    </div>
  );
};

export default App;
