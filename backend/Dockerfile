# ==========================================
# Stage 1: Build & Dependency Caching
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /build

# Copy Maven descriptor and resolve dependencies for Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create a non-root user and group for security
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the repackaged executable jar from the build stage
COPY --from=build /build/target/learning-path-recommender-0.0.1-SNAPSHOT.jar app.jar

# Set file ownership to non-root user
RUN chown -R spring:spring /app

USER spring:spring

# Expose default port (Render will override dynamic port via PORT environment variable)
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
