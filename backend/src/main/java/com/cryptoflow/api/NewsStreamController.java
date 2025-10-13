package com.cryptoflow.api;

import com.cryptoflow.model.NewsEvent;
import com.cryptoflow.service.NewsService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/news")
@CrossOrigin
public class NewsStreamController {

    private final NewsService newsService;

    public NewsStreamController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<NewsEvent>> streamNews() {
        return newsService.streamNews()
                .map(event -> ServerSentEvent.builder(event)
                        .event("news")
                        .id(event.id())
                        .build());
    }
}
