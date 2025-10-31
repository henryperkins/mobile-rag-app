# RAG Mobile - Production-Grade On-Device RAG App

A fully functional, production-ready mobile RAG (Retrieval-Augmented Generation) application built with React Native and Expo. Features local vector storage, document processing (PDF, text, OCR), semantic search, and AI chat capabilities.

## Features

- **On-device Processing**: All document processing and vector storage happens locally
- **Multi-format Support**: PDF, text files, and image OCR
- **Semantic Search**: Natural language search with cosine similarity
- **AI Chat**: Context-aware conversations using retrieved documents
- **Modern UI**: Dark theme with glass morphism design
- **Offline Capable**: Works without internet (except for API calls)
- **SQLite Storage**: Efficient local vector database
- **Thread Management**: Multiple conversation threads
- **Error Handling**: Comprehensive error management

## Tech Stack

- **Frontend**: React Native 0.76.7, Expo 53
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand with persistence
- **Database**: SQLite with custom vector storage
- **AI**: OpenAI GPT-4o and text-embedding-3-small
- **Navigation**: React Navigation 7
- **PDF Processing**: pdf.js-dist
- **Image OCR**: GPT-4o Vision API

## Project Structure

```
src/
├── api/                    # OpenAI API services
│   ├── embeddings.ts      # Text embedding service
│   └── chat-service.ts    # Chat and OCR services
├── components/            # Reusable UI components
│   ├── ChatInput.tsx
│   ├── DocumentCard.tsx
│   ├── ErrorBanner.tsx
│   ├── MessageBubble.tsx
│   └── TypingIndicator.tsx
├── screens/              # Main app screens
│   ├── ChatScreen.tsx
│   ├── DocumentsScreen.tsx
│   ├── DocumentViewer.tsx
│   └── SearchScreen.tsx
├── state/                # Zustand stores
│   ├── chatStore.ts
│   └── documentStore.ts
├── types/                # TypeScript definitions
│   ├── ai.ts
│   └── document.ts
├── utils/                # Utility functions
│   ├── cn.ts
│   ├── cosine.ts
│   ├── documentProcessing.ts
│   ├── uuid.ts
│   └── vectorDb.ts
└── polyfills.ts          # Browser polyfills for pdf.js
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your OpenAI API key in `app.json`:
   ```json
   "extra": {
     "OPENAI_API_KEY": "your-api-key-here"
   }
   ```

   For production, use the secure store implementation in the app settings.

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your device:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## Usage

### Adding Documents

1. **Text Files**: Upload any .txt, .md files directly
2. **PDFs**: Upload PDF documents for automatic text extraction
3. **Images**: Use OCR to extract text from images

All documents are automatically chunked (500 characters with 50 overlap) and embedded for semantic search.

### Chat

- Ask questions about your documents
- The app retrieves relevant chunks and includes them as context
- Create multiple conversation threads
- Long-press messages to delete them

### Search

- Use natural language queries
- Results are ranked by semantic similarity
- Shows similarity scores for each result

## Key Features

### Vector Database
- SQLite-based storage with JSON-serialized embeddings
- Cosine similarity calculations in JavaScript
- Efficient retrieval with top-k results

### Document Processing
- PDF text extraction using pdf.js
- Image OCR with GPT-4o Vision
- Automatic text chunking with overlap
- Batch embedding with error handling

### State Management
- Zustand for reactive state management
- AsyncStorage persistence for chat history
- Real-time updates across all components

### Error Handling
- Dismissible error banners
- Graceful API failure handling
- User-friendly error messages

## Production Considerations

### Security
- API keys stored in SecureStore in production
- No hardcoded sensitive information
- Input validation and sanitization

### Performance
- Efficient chunking strategy
- Lazy loading of documents
- Optimized SQLite queries
- Memory-conscious embedding storage

### Extensibility
- Modular architecture for easy feature addition
- Type-safe interfaces throughout
- Configurable chunking parameters
- Pluggable embedding models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions, please refer to the inline code documentation and comments throughout the codebase.