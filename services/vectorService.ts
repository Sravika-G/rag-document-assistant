import { getEmbedding } from './geminiService';

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for(let i = 0; i < vecA.length; i++){
    dotProduct += (vecA[i] * vecB[i]);
    mA += (vecA[i] * vecA[i]);
    mB += (vecB[i] * vecB[i]);
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

export async function findRelevantChunks(query: string, chunks: Array<{text: string, embedding: string}>, topK: number = 3) {
  const queryEmbedding = await getEmbedding(query);
  
  const chunksWithSimilarity = chunks.map(chunk => {
    const chunkEmbedding = JSON.parse(chunk.embedding);
    return {
      text: chunk.text,
      similarity: cosineSimilarity(queryEmbedding, chunkEmbedding)
    };
  });
  
  chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
  
  return chunksWithSimilarity.slice(0, topK);
}
