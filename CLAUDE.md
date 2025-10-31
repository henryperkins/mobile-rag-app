# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run Jest tests (core utilities coverage)

## Architecture Overview

This is a production-ready React Native Expo RAG (Retrieval-Augmented Generation) application with on-device document processing and vector storage. The app is 100% complete according to `FINAL_POLISH.md` with enterprise-grade features.

### Core Architecture Patterns

**State Management**: Zustand with AsyncStorage persistence maintaining two primary stores:
- `chatStore.ts` - Conversation threads, messages, typing state, and RAG-enabled chat functionality
- `documentStore.ts` - Document operations, file management, OCR processing, and error handling

**Vector Database**: Custom SQLite implementation (`vectorDb.ts`) featuring:
- Document metadata storage with type filtering support
- JSON-serialized text chunk embeddings
- Cosine similarity search (`cosine.ts`) for semantic retrieval
- WAL mode for performance optimization

**Document Processing Pipeline** (`documentProcessing.ts`):
1. Multi-format ingestion (PDF via pdf.js, text files, images via OCR)
2. Intelligent text chunking (500 chars with 50 overlap)
3. Rate-limited OpenAI embedding generation with exponential backoff
4. SQLite storage with vector indexing
5. Semantic retrieval with configurable top-k results

### Advanced Features Implemented

**Production-Grade UI/UX**:
- Swipe-to-delete gestures for messages (`SwipeableMessage.tsx`) with 80px threshold
- Confirmation modals for destructive actions (`ConfirmModal.tsx`)
- Shimmer loading skeletons for perceived performance
- Rich markdown rendering in AI responses only
- Glass morphism dark theme with cyan accents

**Error Handling & Monitoring**:
- Comprehensive Sentry integration (`sentry.ts`) with contextual tagging
- Dismissible error banners throughout the app
- Rate limiting with exponential backoff (200ms→400ms→800ms→1600ms)
- Graceful API failure handling with retry logic

**Performance Optimizations**:
- Efficient chunking strategy preventing overlap waste
- Lazy loading and memory-conscious embedding storage
- Native driver animations for 60fps gestures
- Batch embedding with 150ms base pacing

### Key Technical Components

**RAG Chat Implementation**: Context-aware conversations using retrieved document chunks with similarity scores displayed in context. The chat service automatically retrieves top-3 relevant chunks and includes them as context for GPT-4o.

**Document Type Support**:
- PDFs: Text extraction via pdf.js legacy build (50-page safety cap)
- Images: OCR processing using GPT-4o Vision API
- Text: Direct file reading with UTF-8 encoding

**Database Schema**: SQLite (`rag.db`) with indexed foreign key relationships:
- `documents` table: id, title, size, chunkCount, date, type
- `chunks` table: id, documentId, content, embedding (JSON)

**Navigation Architecture**: React Navigation with:
- Bottom tab navigator (Chat, Documents, Search, Settings)
- Stack navigator for document viewing within Documents tab
- Custom dark theme matching app's glass morphism design

### Critical Implementation Details

**Rate Limiting Strategy**: The `embedWithBackoff()` function implements sophisticated retry logic:
- 429 status codes trigger exponential backoff
- 5xx server errors receive similar treatment
- Randomized jitter (up to 120ms) prevents thundering herd
- Maximum 4 retry attempts before failure

**Security Considerations**:
- OpenAI API key in `app.json` extra field (development)
- Production uses SecureStore for sensitive data
- Input validation and sanitization throughout
- No hardcoded credentials in source code

**Testing Coverage**: Jest configuration (`jest.config.js`) with:
- Core utility testing (`utils.test.ts`)
- Chunking algorithm validation
- Cosine similarity mathematical properties
- React Native module transform ignore patterns

### File Structure Deep Dive

**API Layer** (`src/api/`):
- `embeddings.ts` - OpenAI text embedding service
- `chat-service.ts` - GPT-4o chat with OCR capabilities

**Components** (`src/components/`):
- `MessageBubble.tsx` - Rich markdown rendering for AI messages
- `SwipeableMessage.tsx` - Gesture-based message deletion
- `Shimmer.tsx` & `SkeletonCard.tsx` - Loading animations
- `ConfirmModal.tsx` - Reusable confirmation dialogs

**Utilities** (`src/utils/`):
- `vectorDb.ts` - Core SQLite vector operations
- `documentProcessing.ts` - Complete ingestion pipeline
- `cosine.ts` - Vector similarity calculations
- `sentry.ts` - Error monitoring integration

### Development Workflow

**Adding New Features**:
1. Follow existing component patterns with glass morphism styling
2. Implement proper error handling with Sentry reporting
3. Add loading states with shimmer components
4. Update TypeScript interfaces in `types/` directory
5. Test core utilities with Jest

**Document Management Enhancements**:
- Extend `DocType` in `types/document.ts` for new formats
- Add processing functions in `documentProcessing.ts`
- Update `pickAnyDocument()` picker configuration
- Modify database schema if new metadata required

**Performance Considerations**:
- Maintain 150ms pacing between embedding calls
- Use WAL mode for SQLite operations
- Implement proper cleanup in useEffect hooks
- Consider vector dimensionality for storage efficiency

This codebase represents a production-ready mobile RAG application with enterprise-grade features, comprehensive error handling, and modern React Native best practices.