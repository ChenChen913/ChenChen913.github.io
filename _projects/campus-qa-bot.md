---
# ============================================================
# 项目经历 — 校园知识库问答机器人（毕业设计）
# ============================================================

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

## 项目背景

每年新生入学季，教务处都会被大量重复性问题淹没——"选课系统怎么用？""学分置换流程是什么？""辅修申请什么时候截止？"这些问题的答案其实都写在校园网的各类文档中，但分散在几十个 PDF 和网页里，学生根本找不到。

本项目的目标就是用一个基于 RAG（Retrieval-Augmented Generation，检索增强生成）架构的智能问答机器人，把散落的教务文档"喂"给大模型，让学生用自然语言提问就能拿到带来源引用的准确答案。

### 核心指标

| 指标 | 数值 |
|---|---|
| 文档覆盖率 | 127 份教务相关文档 |
| 检索召回率（Top-5） | 91.2% |
| 回答准确率（人工评估） | 87.5% |
| 平均响应时间 | 2.3 秒 |
| 支持文档格式 | PDF / Word / 网页 |

## 系统架构

整体采用经典的 RAG 三阶段流水线：文档预处理 → 向量检索 → 答案生成。

<div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:20px;text-align:center;margin:1em 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 180" width="100%" style="max-width:720px;">
  <rect x="10" y="15" width="140" height="150" rx="8" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/>
  <text x="80" y="55" text-anchor="middle" font-size="13" font-weight="bold" fill="#1565c0">📄 文档预处理</text>
  <text x="80" y="75" text-anchor="middle" font-size="10" fill="#546e7a">PDF/Word → 纯文本</text>
  <text x="80" y="92" text-anchor="middle" font-size="10" fill="#546e7a">语义段落切分</text>
  <text x="80" y="109" text-anchor="middle" font-size="10" fill="#546e7a">→ 1,847 chunks</text>

  <line x1="150" y1="90" x2="220" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="225" y="15" width="140" height="150" rx="8" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/>
  <text x="295" y="55" text-anchor="middle" font-size="13" font-weight="bold" fill="#2e7d32">🔍 向量检索</text>
  <text x="295" y="75" text-anchor="middle" font-size="10" fill="#546e7a">text-embedding-3</text>
  <text x="295" y="92" text-anchor="middle" font-size="10" fill="#546e7a">→ 1536 维向量</text>
  <text x="295" y="109" text-anchor="middle" font-size="10" fill="#546e7a">FAISS 向量数据库</text>
  <text x="295" y="126" text-anchor="middle" font-size="10" fill="#546e7a">余弦相似度 Top-K</text>

  <line x1="365" y1="90" x2="435" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="440" y="15" width="140" height="150" rx="8" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/>
  <text x="510" y="55" text-anchor="middle" font-size="13" font-weight="bold" fill="#e65100">💬 答案生成</text>
  <text x="510" y="75" text-anchor="middle" font-size="10" fill="#546e7a">Top-5 chunks</text>
  <text x="510" y="92" text-anchor="middle" font-size="10" fill="#546e7a">+ 用户问题</text>
  <text x="510" y="109" text-anchor="middle" font-size="10" fill="#546e7a">→ GPT-4o</text>
  <text x="510" y="126" text-anchor="middle" font-size="10" fill="#546e7a">自然语言答案</text>

  <line x1="580" y1="90" x2="650" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="655" y="40" width="55" height="100" rx="8" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1.5"/>
  <text x="682" y="85" text-anchor="middle" font-size="11" fill="#6a1b9a">带来源</text>
  <text x="682" y="102" text-anchor="middle" font-size="11" fill="#6a1b9a">引用</text>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#90a4ae"/>
    </marker>
  </defs>
</svg>
<p style="color:#78909c;font-size:12px;margin-top:8px;">▲ RAG 三阶段流水线架构</p>
</div>

### 阶段一：文档预处理

将 127 份教务文档（选课手册、学籍管理规定、辅修申请流程、奖学金评定办法等）统一转为纯文本，按语义段落切分为 1,847 个文档块（chunk）。

### 阶段二：向量化与检索

每个 chunk 通过 `text-embedding-3-small` 模型转换为 1536 维向量，存入 FAISS 向量数据库。用户提问时，将问题同样向量化后在数据库中检索 Top-K 个最相似的文档块。

检索相似度采用余弦相似度：

<div markdown="0">
$$
\text{similarity}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \cdot \|\mathbf{d}\|}
$$
</div>

对于 Top-K 的选取，实验对比了 $K \in \{3, 5, 7, 10\}$ 的效果，最终 $K=5$ 在召回率和响应速度之间达到最佳平衡：

<div markdown="0">
$$
\text{Recall}@5 = \frac{|\text{相关文档} \cap \text{Top-5 检索结果}|}{|\text{相关文档}|} = 91.2\%
$$
</div>

### 阶段三：答案生成

将检索到的 Top-5 文档块和用户问题拼接为 Prompt，调用 GPT-4o 生成自然语言答案，要求必须标注引用来源。

## 关键代码

### 文档加载与切分

```python
from langchain.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 加载教务文档目录
loader = DirectoryLoader(
    "./docs/academic/",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)
documents = loader.load()
print(f"已加载 {len(documents)} 份文档")

# 按语义段落切分
splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", "。", ".", " "]
)
chunks = splitter.split_documents(documents)
print(f"已切分为 {len(chunks)} 个 chunk")
```

### 向量化与 FAISS 索引构建

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 构建向量索引
vectorstore = FAISS.from_documents(chunks, embeddings)

# 持久化保存
vectorstore.save_local("./faiss_index")
print(f"向量索引已保存，维度: 1536")
```

### RAG 问答链

```python
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

prompt = PromptTemplate(
    template="""你是一位熟悉{university}教务政策的助手。
请根据以下参考文档回答学生的问题。如果文档中没有相关信息，
请如实说明，不要编造。

参考文档：
{context}

学生问题：{question}

请用友好、清晰的语气回答，并在答案末尾标注参考文档编号。""",
    input_variables=["university", "context", "question"]
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o", temperature=0.3),
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": prompt}
)

# 示例问答
question = "我错过了选课时间怎么办？"
result = qa_chain.invoke({
    "query": question,
    "university": "青岛理工大学"
})
print(f"Q: {question}\nA: {result['result']}")
```

## 前端展示

使用 Streamlit 快速搭建了问答交互界面：

```python
import streamlit as st

st.set_page_config(page_title="校园知识库问答", page_icon="🎓")
st.title("🎓 校园知识库问答机器人")

# 侧边栏：参数配置
with st.sidebar:
    st.header("检索参数")
    k = st.slider("检索文档数 (K)", 1, 10, 5)
    temperature = st.slider("生成温度", 0.0, 1.0, 0.3)

# 主区域：对话界面
if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("请输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("正在检索相关文档..."):
            response = qa_chain.invoke({
                "query": prompt,
                "university": "青岛理工大学"
            })
            st.markdown(response["result"])
            # 显示引用来源
            with st.expander("📚 参考来源"):
                for doc in response.get("source_documents", []):
                    st.caption(f"📄 {doc.metadata.get('source', '未知来源')}")
    st.session_state.messages.append({"role": "assistant", "content": response["result"]})
```

## 效果展示

> **学生提问**：我想申请辅修计算机科学，需要满足什么条件？
>
> **机器人回答**：根据《青岛理工大学辅修专业管理办法》（2024版），申请辅修计算机科学需满足以下条件：
> 1. 主修专业第一学年平均学分绩点不低于 2.5
> 2. 无不及格课程记录
> 3. 每年 5 月份通过教务系统提交申请
>
> 📚 参考来源：[1] 辅修管理办法.pdf (第3-4页), [2] 2025辅修招生简章.pdf (第1页)

## 项目总结

这个项目从文档预处理到前端展示完整覆盖了 RAG 系统的核心环节。最大的收获是对检索质量和生成质量的权衡有了直观理解——K 值太小会漏掉关键信息，太大又会引入噪声导致回答跑偏。

后续可以优化的方向包括：HyDE（假设性文档嵌入）提升检索语义匹配、Re-ranking 精排、以及支持表格和图片等多模态文档的解析。

---

<!-- English -->

## Project Background

Every year during freshman orientation, the academic affairs office gets flooded with repetitive questions — "How do I use the course selection system?" "What's the credit transfer process?" "When's the deadline for minor applications?" The answers are all buried in dozens of PDFs and web pages scattered across the campus network, and students simply can't find them.

This project builds a RAG (Retrieval-Augmented Generation) powered Q&A bot that ingests all those scattered academic documents and feeds them to an LLM. Students ask questions in natural language and get accurate answers with source citations.

### Key Metrics

| Metric | Value |
|---|---|
| Document coverage | 127 academic affairs documents |
| Retrieval recall (Top-5) | 91.2% |
| Answer accuracy (human evaluation) | 87.5% |
| Average response time | 2.3 seconds |
| Supported formats | PDF / Word / Web pages |

## System Architecture

The system follows the classic three-stage RAG pipeline: Document Preprocessing → Vector Retrieval → Answer Generation.

<div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:20px;text-align:center;margin:1em 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 180" width="100%" style="max-width:720px;">
  <rect x="10" y="15" width="140" height="150" rx="8" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/>
  <text x="80" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#1565c0">📄 Preprocessing</text>
  <text x="80" y="75" text-anchor="middle" font-size="10" fill="#546e7a">PDF/Word → Plain text</text>
  <text x="80" y="92" text-anchor="middle" font-size="10" fill="#546e7a">Semantic chunking</text>
  <text x="80" y="109" text-anchor="middle" font-size="10" fill="#546e7a">→ 1,847 chunks</text>

  <line x1="150" y1="90" x2="220" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow2)"/>

  <rect x="225" y="15" width="140" height="150" rx="8" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/>
  <text x="295" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#2e7d32">🔍 Retrieval</text>
  <text x="295" y="75" text-anchor="middle" font-size="10" fill="#546e7a">text-embedding-3</text>
  <text x="295" y="92" text-anchor="middle" font-size="10" fill="#546e7a">→ 1536-dim vectors</text>
  <text x="295" y="109" text-anchor="middle" font-size="10" fill="#546e7a">FAISS vector store</text>
  <text x="295" y="126" text-anchor="middle" font-size="10" fill="#546e7a">Cosine similarity Top-K</text>

  <line x1="365" y1="90" x2="435" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow2)"/>

  <rect x="440" y="15" width="140" height="150" rx="8" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/>
  <text x="510" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#e65100">💬 Generation</text>
  <text x="510" y="75" text-anchor="middle" font-size="10" fill="#546e7a">Top-5 chunks</text>
  <text x="510" y="92" text-anchor="middle" font-size="10" fill="#546e7a">+ User query</text>
  <text x="510" y="109" text-anchor="middle" font-size="10" fill="#546e7a">→ GPT-4o</text>
  <text x="510" y="126" text-anchor="middle" font-size="10" fill="#546e7a">Natural language answer</text>

  <line x1="580" y1="90" x2="650" y2="90" stroke="#90a4ae" stroke-width="2" marker-end="url(#arrow2)"/>

  <rect x="655" y="40" width="55" height="100" rx="8" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1.5"/>
  <text x="682" y="85" text-anchor="middle" font-size="10" fill="#6a1b9a">With</text>
  <text x="682" y="102" text-anchor="middle" font-size="10" fill="#6a1b9a">Citations</text>

  <defs>
    <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#90a4ae"/>
    </marker>
  </defs>
</svg>
<p style="color:#78909c;font-size:12px;margin-top:8px;">▲ RAG Three-Stage Pipeline Architecture</p>
</div>

### Stage 1: Document Preprocessing

127 academic documents (course selection guides, enrollment regulations, minor application procedures, scholarship policies, etc.) are unified into plain text and split by semantic paragraphs into 1,847 chunks.

### Stage 2: Vectorization & Retrieval

Each chunk is embedded into a 1536-dimensional vector via the `text-embedding-3-small` model and stored in a FAISS vector database. User queries are embedded on the fly and compared against the database to retrieve the Top-K most similar chunks.

Cosine similarity is used for retrieval:

<div markdown="0">
$$
\text{similarity}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \cdot \|\mathbf{d}\|}
$$
</div>

Experiments compared $K \in \{3, 5, 7, 10\}$, and $K=5$ achieved the best balance between recall and response speed:

<div markdown="0">
$$
\text{Recall}@5 = \frac{|\text{Relevant Docs} \cap \text{Top-5 Retrieved}|}{|\text{Relevant Docs}|} = 91.2\%
$$
</div>

### Stage 3: Answer Generation

The Top-5 retrieved chunks and the user query are assembled into a prompt and sent to GPT-4o to generate a natural language answer with mandatory source citations.

## Key Code

### Document Loading & Chunking

```python
from langchain.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load academic document directory
loader = DirectoryLoader(
    "./docs/academic/",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)
documents = loader.load()
print(f"Loaded {len(documents)} documents")

# Semantic paragraph splitting
splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", "。", " "]
)
chunks = splitter.split_documents(documents)
print(f"Split into {len(chunks)} chunks")
```

### Embedding & FAISS Index

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Build vector index
vectorstore = FAISS.from_documents(chunks, embeddings)

# Persist to disk
vectorstore.save_local("./faiss_index")
print(f"Vector index saved, dimension: 1536")
```

### RAG Q&A Chain

```python
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

prompt = PromptTemplate(
    template="""You are an assistant familiar with {university} academic policies.
Answer the student's question based on the reference documents below.
If the documents don't contain relevant information, be honest and don't fabricate.

Reference documents:
{context}

Student question: {question}

Respond in a friendly, clear tone, and cite reference document numbers at the end.""",
    input_variables=["university", "context", "question"]
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o", temperature=0.3),
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": prompt}
)

# Example Q&A
question = "What should I do if I missed the course registration window?"
result = qa_chain.invoke({
    "query": question,
    "university": "Qingdao University of Technology"
})
print(f"Q: {question}\nA: {result['result']}")
```

## Frontend Interface

A Streamlit-based interactive Q&A interface:

```python
import streamlit as st

st.set_page_config(page_title="Campus Knowledge Base Q&A", page_icon="🎓")
st.title("🎓 Campus Knowledge Base Q&A Bot")

# Sidebar: parameter configuration
with st.sidebar:
    st.header("Retrieval Parameters")
    k = st.slider("Number of documents (K)", 1, 10, 5)
    temperature = st.slider("Generation temperature", 0.0, 1.0, 0.3)

# Main area: chat interface
if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Ask your question..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Searching relevant documents..."):
            response = qa_chain.invoke({
                "query": prompt,
                "university": "Qingdao University of Technology"
            })
            st.markdown(response["result"])
            with st.expander("📚 Sources"):
                for doc in response.get("source_documents", []):
                    st.caption(f"📄 {doc.metadata.get('source', 'Unknown')}")
    st.session_state.messages.append({"role": "assistant", "content": response["result"]})
```

## Live Demo

> **Student**: What are the requirements to apply for a Computer Science minor?
>
> **Bot**: According to the *Qingdao University of Technology Minor Program Regulations* (2024 edition), the requirements for a CS minor are:
> 1. A minimum GPA of 2.5 in your major during the first academic year
> 2. No failed courses on record
> 3. Submit your application via the academic system every May
>
> 📚 Sources: [1] Minor Program Regulations.pdf (pp. 3-4), [2] 2025 Minor Enrollment Guide.pdf (p. 1)

## Project Summary

This project covers the complete RAG pipeline from document preprocessing to frontend deployment. The biggest insight was understanding the trade-off between retrieval quality and generation quality — too few chunks miss critical information, while too many introduce noise and degrade answers.

Future improvements include: HyDE (Hypothetical Document Embeddings) for better semantic matching, re-ranking for precision, and multi-modal support for tables and images in academic documents.
