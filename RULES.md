# Development Rules

## Single Instance Server Management

### Rule: Always ensure only one server instance is running

**Problem**: Multiple server instances running on different ports cause:
- Port conflicts and confusion
- Proxy configuration issues
- Inconsistent API responses
- Development environment instability

**Solution**: Use the provided scripts to ensure single-instance management:

### Available Scripts

#### 1. Clean Development Start
```bash
npm run dev:clean
```
- Kills all existing server processes
- Waits for ports to be available
- Starts both API (3001) and Frontend (3000) servers
- Ensures clean startup every time

#### 2. Production Start
```bash
npm run start
# or
npm run dev:production
```
- Same as dev:clean but for production environment
- Kills existing processes before starting

#### 3. Cleanup All Servers
```bash
npm run cleanup
# or
npm run kill-servers
```
- Kills all running server processes
- Frees up ports 3000, 3001, 3002
- Useful when you need to start fresh

### Manual Commands (Avoid These)

❌ **Don't use these directly**:
```bash
npm run dev:react    # Can cause port conflicts
npm run dev:api      # Can cause port conflicts
npx tsx src/backend/api/server.ts  # Can cause port conflicts
```

✅ **Use these instead**:
```bash
npm run dev:clean    # Single instance management
npm run start        # Production single instance
npm run cleanup      # Clean up before starting
```

### Port Configuration

- **Frontend**: Port 3000 (Vite)
- **API Server**: Port 3001 (Express)
- **Proxy**: Vite proxies `/api` to `http://localhost:3001`

### Process Names Monitored

The scripts automatically kill these process types:
- `vite` (Frontend development server)
- `tsx` (TypeScript execution)
- `node` (Node.js processes)

### Benefits

1. **No Port Conflicts**: Always starts with clean ports
2. **Consistent Environment**: Same setup every time
3. **Easy Debugging**: Clear process management
4. **Reliable Proxy**: Frontend always connects to correct API
5. **Graceful Shutdown**: Proper cleanup on Ctrl+C

### Troubleshooting

If you encounter issues:

1. **Clean everything first**:
   ```bash
   npm run cleanup
   ```

2. **Start fresh**:
   ```bash
   npm run dev:clean
   ```

3. **Check port availability**:
   ```bash
   lsof -ti:3000,3001,3002
   ```

### Development Workflow

1. **Start development**:
   ```bash
   npm run dev:clean
   ```

2. **Make changes** (hot reload works)

3. **Stop servers**: Press `Ctrl+C`

4. **Restart if needed**:
   ```bash
   npm run dev:clean
   ```

This approach ensures a stable, predictable development environment with no conflicting server instances. 