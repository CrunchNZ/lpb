# Troubleshooting Guide - Solana Liquidity Sentinel

## Overview

This guide provides solutions for common issues encountered when using the Solana Liquidity Sentinel bot. Each section includes diagnostic steps and resolution procedures.

## Quick Diagnosis

### Health Check Commands

```bash
# Check application status
pm2 status

# Check logs
pm2 logs solana-liquidity-sentinel

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/database
curl http://localhost:3000/health/solana

# Check system resources
df -h
free -h
top
```

## Common Issues & Solutions

### 1. Application Won't Start

#### Symptoms
- Application fails to launch
- PM2 shows "error" status
- No response from health endpoints

#### Diagnostic Steps

```bash
# Check PM2 status
pm2 status

# Check detailed logs
pm2 logs solana-liquidity-sentinel --lines 50

# Check environment variables
echo $NODE_ENV
echo $TWITTER_BEARER_TOKEN
echo $SOLANA_RPC_URL
```

#### Common Causes & Solutions

**Missing Environment Variables**
```bash
# Solution: Set required environment variables
export TWITTER_BEARER_TOKEN=your_token
export SOLANA_RPC_URL=your_rpc_url
export METEORA_API_KEY=your_key
export JUPITER_API_KEY=your_key

# Restart application
pm2 restart solana-liquidity-sentinel
```

**Port Already in Use**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process or change port
kill -9 <PID>
# OR
export PORT=3001
pm2 restart solana-liquidity-sentinel
```

**Database Connection Issues**
```bash
# Check database file permissions
ls -la /opt/solana-bot/data/

# Fix permissions
sudo chown -R solana-bot:solana-bot /opt/solana-bot/data/

# Recreate database if corrupted
rm /opt/solana-bot/data/production.db
npm run db:migrate
```

### 2. Connection Errors

#### Symptoms
- "Network error" messages
- Timeout errors
- API connection failures

#### Diagnostic Steps

```bash
# Test internet connectivity
ping google.com

# Test Solana RPC
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' \
  $SOLANA_RPC_URL

# Test API endpoints
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  https://api.twitter.com/2/tweets/search/recent?query=solana
```

#### Common Causes & Solutions

**Firewall Blocking Connections**
```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow out 80/tcp
sudo ufw allow out 443/tcp
sudo ufw allow out 8899/tcp
```

**Invalid API Keys**
```bash
# Verify API keys are correct
# Check key permissions and rate limits
# Rotate keys if necessary
```

**RPC Endpoint Issues**
```bash
# Try alternative RPC endpoints
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# OR
export SOLANA_RPC_URL=https://solana-api.projectserum.com
```

### 3. Poor Performance

#### Symptoms
- Slow position execution
- High memory usage
- Frequent timeouts

#### Diagnostic Steps

```bash
# Check system resources
htop
iostat
iotop

# Check application metrics
curl http://localhost:3000/metrics

# Check database performance
sqlite3 production.db "PRAGMA integrity_check;"
```

#### Common Causes & Solutions

**High Memory Usage**
```bash
# Increase PM2 memory limit
pm2 restart solana-liquidity-sentinel --max-memory-restart 2G

# Check for memory leaks
pm2 monit
```

**Database Performance**
```bash
# Optimize database
sqlite3 production.db "VACUUM;"
sqlite3 production.db "ANALYZE;"

# Add indexes if missing
npm run db:optimize
```

**Network Latency**
```bash
# Use closer RPC endpoint
# Consider dedicated RPC service
# Implement connection pooling
```

### 4. Trading Issues

#### Symptoms
- Positions not opening
- Failed transactions
- Incorrect position sizing

#### Diagnostic Steps

```bash
# Check wallet balance
npm run wallet:balance

# Check transaction logs
pm2 logs solana-liquidity-sentinel | grep "transaction"

# Verify strategy settings
curl http://localhost:3000/api/strategy/config
```

#### Common Causes & Solutions

**Insufficient Balance**
```bash
# Check wallet balance
# Add funds to wallet
# Reduce position size limits
```

**Transaction Failures**
```bash
# Check Solana network status
# Increase transaction timeout
# Use higher priority fees
```

**Strategy Configuration Issues**
```bash
# Reset strategy settings
npm run strategy:reset

# Verify configuration
npm run config:validate
```

### 5. Data Issues

#### Symptoms
- Missing market data
- Incorrect sentiment scores
- Stale position information

#### Diagnostic Steps

```bash
# Check data sources
curl http://localhost:3000/health/apis

# Check database integrity
npm run db:verify

# Test data feeds
npm run test:data-sources
```

#### Common Causes & Solutions

**API Rate Limits**
```bash
# Implement rate limiting
# Upgrade API plans
# Add request caching
```

**Database Corruption**
```bash
# Backup current data
cp production.db production.db.backup

# Recreate database
rm production.db
npm run db:migrate
npm run db:seed
```

**Network Connectivity**
```bash
# Check internet connection
# Verify DNS resolution
# Test API endpoints
```

## Error Codes Reference

### E001: Insufficient Balance
- **Cause**: Wallet balance too low for position
- **Solution**: Add funds or reduce position size

### E002: Network Error
- **Cause**: Connection to Solana network failed
- **Solution**: Check internet and RPC settings

### E003: Transaction Failed
- **Cause**: Transaction rejected by network
- **Solution**: Check gas fees and try again

### E004: API Rate Limit
- **Cause**: Too many API requests
- **Solution**: Wait and retry, or upgrade API plan

### E005: Database Error
- **Cause**: Database connection or query failure
- **Solution**: Check database integrity and permissions

### E006: Strategy Error
- **Cause**: Strategy execution failure
- **Solution**: Check strategy configuration and market conditions

### E007: Wallet Error
- **Cause**: Wallet connection or signing failure
- **Solution**: Reconnect wallet and verify permissions

### E008: Validation Error
- **Cause**: Invalid input data
- **Solution**: Check input parameters and format

## Performance Optimization

### Database Optimization

```bash
# Regular maintenance
sqlite3 production.db "VACUUM;"
sqlite3 production.db "ANALYZE;"

# Add indexes
CREATE INDEX idx_positions_token ON positions(token);
CREATE INDEX idx_positions_strategy ON positions(strategy);
CREATE INDEX idx_positions_created ON positions(created_at);
```

### Memory Optimization

```bash
# Monitor memory usage
pm2 monit

# Set memory limits
pm2 restart solana-liquidity-sentinel --max-memory-restart 1G

# Enable garbage collection
export NODE_OPTIONS="--max-old-space-size=1024"
```

### Network Optimization

```bash
# Use connection pooling
# Implement request caching
# Use CDN for static assets
# Optimize API calls
```

## Monitoring & Alerts

### Health Monitoring

```bash
# Set up monitoring script
#!/bin/bash
HEALTH=$(curl -s http://localhost:3000/health)
if [[ $HEALTH != *"healthy"* ]]; then
    echo "Application unhealthy: $HEALTH"
    # Send alert
fi
```

### Performance Monitoring

```bash
# Monitor key metrics
- CPU usage
- Memory usage
- Disk I/O
- Network latency
- Database performance
- API response times
```

### Alert Configuration

```bash
# Set up alerts for
- Application crashes
- High error rates
- Performance degradation
- Balance changes
- Position losses
```

## Recovery Procedures

### Application Recovery

```bash
# Restart application
pm2 restart solana-liquidity-sentinel

# Check status
pm2 status
pm2 logs solana-liquidity-sentinel

# Verify health
curl http://localhost:3000/health
```

### Database Recovery

```bash
# Stop application
pm2 stop solana-liquidity-sentinel

# Restore from backup
cp backup_file.db production.db

# Start application
pm2 start solana-liquidity-sentinel

# Verify data
npm run db:verify
```

### Emergency Procedures

```bash
# Emergency stop
pm2 stop solana-liquidity-sentinel
npm run emergency:close-positions

# Backup current state
./scripts/backup.sh

# Notify administrators
./scripts/notify-admin.sh "EMERGENCY_STOP"
```

## Support Resources

### Documentation
- **User Guide**: `docs/user-guide.md`
- **API Reference**: `docs/api-reference.md`
- **Deployment Guide**: `docs/deployment-guide.md`

### Logs
- **Application logs**: `/opt/solana-bot/logs/`
- **PM2 logs**: `pm2 logs solana-liquidity-sentinel`
- **System logs**: `/var/log/syslog`

### Community Support
- **Discord**: Join community server
- **Telegram**: Official channel
- **GitHub**: Issue tracker

### Contact Information
- **Email**: support@solana-liquidity-sentinel.com
- **Emergency**: +1-XXX-XXX-XXXX

## Prevention Best Practices

### Regular Maintenance
- Daily health checks
- Weekly performance reviews
- Monthly security audits
- Quarterly system updates

### Monitoring Setup
- Set up comprehensive monitoring
- Configure automated alerts
- Regular backup testing
- Performance benchmarking

### Documentation
- Keep logs organized
- Document configuration changes
- Maintain troubleshooting notes
- Update procedures regularly

---

**Last Updated**: Current session
**Version**: 1.0.0
**Maintainer**: AI Development Team 