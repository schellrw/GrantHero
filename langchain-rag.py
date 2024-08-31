from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import HuggingFacePipeline
from langchain.chains import RetrievalQA
import torch

# Global variables
tokenizer = None
model = None
embeddings = None
vector_store = None
qa_chain = None

def initialize_rag_engine():
    global tokenizer, model, embeddings, vector_store, qa_chain

    # Initialize tokenizer and model
    model_name = "google/flan-t5-base"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    # Initialize embeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # Load and preprocess documents
    with open("nih_sbir_docs.txt", "r") as f:
        nih_docs = f.read()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_text(nih_docs)

    # Create vector store
    vector_store = Chroma.from_texts(texts, embeddings)

    # Create LLM
    llm = HuggingFacePipeline.from_model_id(
        model_id=model_name,
        task="text2text-generation",
        model_kwargs={"temperature": 0, "max_length": 512},
    )

    # Create QA chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(),
    )

def process_grant_application(application_text):
    queries = [
        "What is the main research question of this proposal?",
        "Does this proposal meet the SBIR eligibility requirements?",
        "What are the strengths and weaknesses of this proposal?",
        "Are there any missing elements in this proposal?",
    ]
    
    results = []
    for query in queries:
        result = qa_chain({"query": query, "context": application_text})
        results.append(result)
    
    feedback = combine_and_process_results(results)
    return feedback

def combine_and_process_results(results):
    combined_feedback = ""
    for i, result in enumerate(results):
        combined_feedback += f"Question {i+1}: {result['query']}\n"
        combined_feedback += f"Answer: {result['result']}\n\n"
    return combined_feedback