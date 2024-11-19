# **Twitter Trending Hashtags**

A application to generate and retrieve a list of the most popular trending hashtags from simulated tweets. The application is designed to be fast, scalable, and durable using Redis for state storage and in-memory processing.

---

## **Features**

- **POST /tweet:** Accepts tweets and extracts hashtags for processing.
- **GET /trending-hashtags:** Retrieves the top 25 trending hashtags in descending order.
- Uses Redis Bloom Filter to deduplicate tweets and Redis Top-K to maintain trending hashtags efficiently.
- Supports high loads with asynchronous processing.
- Data persists across service restarts.

---

## **Requirements**

- Node.js (v18 or higher recommended)
- Redis (with RedisBloom module installed)
- npm (comes with Node.js)

---

## **Installation**

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-repo/twitter-trending-hashtags.git](https://github.com/deepakdantagani1/twitter-trending-hashtags.git)
   cd twitter-trending-hashtags
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Redis:**
   - Ensure Redis is installed and running.
   - If RedisBloom is not installed, add it:
     Refer to the official RedisBloom documentation for installation instructions: https://github.com/RedisBloom/RedisBloom

4. **Configure environment variables (if needed):**
   - Default Redis URL is `redis://localhost:6379`.
     REDIS_URL=redis://<your-redis-url>:6379
     ```

5. **Start the server:**
   ```bash
   npm start
   ```

---

## **Usage**

### **1. Create a Tweet**

**Endpoint:** `POST /api/v1/tweets`

**Request:**
```json
{
  "tweet": "This is a tweet with #RedisBloom and #TopK"
}
```

**Response:**
```json
{
  "message": "Tweet received for processing."
}
```

---

### **2. Get Trending Hashtags**

**Endpoint:** `GET /api/v1/hashtags`

**Response:**
```json
{
  "hashtags": [
    { "hashtag": "#topk", "count": 100 },
    { "hashtag": "#redisbloom", "count": 90 }
  ]
}
```

---

## **Technical Details**

### **How It Works**

1. **Bloom Filter for Deduplication:**
   - Uses Redis Bloom Filter (`BLOOM_FILTER_KEY`) to avoid processing duplicate tweets efficiently.
   - This minimizes memory usage and ensures near-constant lookup time for deduplication.

2. **Top-K for Trending Hashtags:**
   - Uses Redis Top-K data structure (`TOP_K_KEY`) to track and rank the most popular hashtags with approximate counts.

3. **Asynchronous Processing:**
   - Tweets are processed in the background to ensure quick response times.

4. **Durability:**
   - Redis persists Bloom Filter and Top-K data structures to ensure data is retained across service restarts.

---

## **Scaling and Performance**

- **Handles High Loads:**
  - Designed to handle several requests per second by leveraging asynchronous processing and Redis for state management.
  
- **Efficient Algorithms:**
  - Redis Bloom Filter and Top-K structures use approximate algorithms to ensure low computational overhead.

- **Distributed Redis:**
  - Can be extended with Redis clustering to handle high-scale environments.

---

## **Production-Level Design**

### **High-Level Architecture**

The production-ready design scales seamlessly for high loads and ensures fault tolerance. It uses **Amazon EKS (Elastic Kubernetes Service)** for container orchestration and integrates AWS-managed services for reliability.

#### **Components**

1. **AWS Load Balancer:**
   - **AWS ALB (Application Load Balancer)** serves as the entry point, routing client requests to Kubernetes services.

2. **Kubernetes Cluster (Amazon EKS):**
   - Hosts the following microservices:
     - **Tweet API Service:** Handles incoming tweets and deduplication.
     - **Hashtag Processor Service:** Updates Redis with hashtags asynchronously.
     - **Trending API Service:** Fetches the top 25 hashtags from Redis.

3. **Data Storage (Redis):**
   - **BLOOM_FILTER_KEY:** Ensures tweets are processed only once.
   - **TOP_K_KEY:** Efficiently tracks and ranks the top hashtags.

4. **Messaging (Kafka):**
   - Decouples data ingestion and processing for high throughput and fault tolerance.

5. **Monitoring and Security:**
   - **CloudWatch Logs:** Capture logs for debugging and auditing.

---

### **Data Flow**

1. **Tweet Ingestion:**
   - Client sends a `POST /tweet` request.
   - Tweet API checks `BLOOM_FILTER_KEY` for deduplication and publishes hashtags to Kafka.

2. **Hashtag Processing:**
   - Kafka consumers update `TOP_K_KEY` in Redis with hashtag counts.

3. **Trending Hashtag Retrieval:**
   - Trending API fetches the top 25 hashtags from `TOP_K_KEY` in Redis.

---

### **Scalability**

1. **Kubernetes Autoscaling:**
   - Automatically scales pod replicas based on CPU and memory usage.

2. **Redis Scaling:**
   - Extend Redis with clustering for horizontal scaling.

3. **Kafka Scaling:**
   - Increase Kafka partitions and brokers for high-throughput messaging.
