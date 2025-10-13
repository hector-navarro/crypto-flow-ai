# syntax=docker/dockerfile:1

FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY src ./src
RUN mkdir -p out && \
    find src/main/java -name "*.java" > sources.txt && \
    javac @sources.txt -d out
RUN jar --create --file app.jar --main-class com.cryptoflow.CryptoFlowBackendApplication -C out .

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
