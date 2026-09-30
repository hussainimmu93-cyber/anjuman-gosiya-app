"use strict";

const CACHE_NAME = "anjuman-gosiya-v3";

const FILES = [
    "./",
    "./index.html",
    "./app.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(FILES);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys.map(function (key) {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        fetch(event.request)
            .then(function (networkResponse) {
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    event.request.method === "GET"
                ) {
                    var responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseClone);
                    });
                }

                return networkResponse;
            })
            .catch(function () {
                return caches.match(event.request)
                    .then(function (response) {
                        return response || caches.match("./index.html");
                    });
            })
    );
});