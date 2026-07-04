---


zh:
  title: 校园知识库问答机器人（毕业设计）
  meta: 独立开发 · 2025.09 — 2026.03
  desc: 基于 RAG 架构的毕业设计，向量化教务文档支持多轮问答。
  tech: [Python, LangChain, FAISS, Streamlit]
en:
  title: Campus Knowledge-Base Q&A Bot (Capstone Project)
  meta: Solo Developer · Sep 2025 — Mar 2026
  desc: RAG-based capstone project powering multi-turn Q&A with campus document vectorization.
  tech: [Python, LangChain, FAISS, Streamlit]

github: "#"
demo: "#"

---

## 项目介绍

每年新生入学季，教务处都会被大量重复性问题淹没——"选课系统怎么用？""学分置换流程是什么？""辅修申请什么时候截止？"这些问题的答案其实都写在校园网的各类文档中，但分散在几十个 PDF 和网页里，学生根本找不到。

本项目的目标就是用一个基于 RAG（Retrieval-Augmented Generation，检索增强生成）架构的智能问答机器人，把散落的教务文档"喂"给大模型，让学生用自然语言提问就能拿到带来源引用的准确答案。

<iframe src="{{ '/assets/pdf-viewer.html?file=' | relative_url }}{{ '/assets/projects/campus-qa-report.pdf' | relative_url }}"
  width="100%" height="850px"
  style="border:1px solid var(--border); border-radius:8px;"
  title="项目完整报告 PDF">
</iframe>

<!-- English -->
## Project Introduction

Every year during freshman orientation, the academic affairs office gets flooded with repetitive questions — "How do I use the course selection system?" "What's the credit transfer process?" "When's the deadline for minor applications?" The answers are all buried in dozens of PDFs and web pages scattered across the campus network, and students simply can't find them.

This project builds a RAG (Retrieval-Augmented Generation) powered Q&A bot that ingests all those scattered academic documents and feeds them to an LLM. Students ask questions in natural language and get accurate answers with source citations.

<iframe src="{{ '/assets/pdf-viewer.html?file=' | relative_url }}{{ '/assets/projects/campus-qa-report.pdf' | relative_url }}"
  width="100%" height="850px"
  style="border:1px solid var(--border); border-radius:8px;"
  title="Full Project Report PDF">
</iframe>
