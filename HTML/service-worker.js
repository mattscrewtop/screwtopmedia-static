// Load the sw-tookbox library.
//importScripts('./sw-toolbox.js');
//importScripts('./runtime-caching.js');



// tick this to make the cache invalidate and update
const CACHE_VERSION = 3103;
const CURRENT_CACHES =
	{
		'app-shell': 'app-shell-cache-v' + CACHE_VERSION,
		'app-data': 'app-data-cache-v' + CACHE_VERSION,
	};

//APP SHELL FILES...
var filesToCache = 
[
	'/home/index.html',
	'/home/'
	//'/manifest.json'
];

var cacehableRequestsList = ['screwtopmedia', 'googleapis', 'gstatic', 'jwpcdn', 'cloudcms', 'cdf'];


//WHILE INSTALLING SERVICE WORKER, CACHE APP SHELL...
self.addEventListener('install', (event) =>
{
	console.log('******* INSTALL', event);

	event.waitUntil
	(
		caches.open(CURRENT_CACHES['app-shell']).then
		(
			function(cache) 
			{
				console.log('[ServiceWorker] Caching app shell...', cache);
				return cache.addAll(filesToCache);
			}
		)
	);
});



self.addEventListener('activate', (event) =>
{
	console.log('******* ACTIVATE', event);

	// Delete all caches that aren't named in CURRENT_CACHES.
	// While there is only one cache in this example, the same logic will handle the case where
	// there are multiple versioned caches.
	const expectedCacheNames = Object.keys(CURRENT_CACHES).map((key) =>
	{
		return CURRENT_CACHES[key];
	});

	console.log('ACTIVATE: EXPECTED CACHE NAMES:', expectedCacheNames);

	event.waitUntil
	(
		caches.keys().then((cacheNames) =>
		{
			return Promise.all(
				cacheNames.map((cacheName) =>
				{
					if (expectedCacheNames.indexOf(cacheName) === -1)
					{
						// If this cache name isn't present in the array of "expected" cache names, then delete it.
						console.log('Deleting out of date cache:', cacheName);

						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});




// This sample illustrates an aggressive approach to caching, in which every valid response is
// cached and every request is first checked against the cache.
// This may not be an appropriate approach if your web application makes requests for
// arbitrary URLs as part of its normal operation (e.g. a RSS client or a news aggregator),
// as the cache could end up containing large responses that might not end up ever being accessed.
// Other approaches, like selectively caching based on response headers or only caching
// responses served from a specific domain, might be more appropriate for those use cases.
self.addEventListener('fetch', (event) => 
{
	if (event.request.method === 'GET')
	{ 
		// Parse the URL:
		var requestURL = new URL(event.request.url);	
		var filesToCacheName = filesToCache.find((n) => n === requestURL.pathname);
		var isAppShellCache = (filesToCacheName !== undefined)
		var isRequestCacheable = false;
		
		//CHECK IF URL IS FROM A CACHEABLE SOURCE...
		if (cacehableRequestsList.some(function(v) { return event.request.url.indexOf(v) >= 0; })) 
		{
			// There's at least one
			console.log('WILL BE CACHED... ', event.request.url);
			isRequestCacheable = true;
		}	  

		if (!isRequestCacheable)
		{ 
			console.log('--------- REQUEST URL... ', event.request.url);
			console.log('--------- IS CACHEABLE... ', isRequestCacheable);
			console.log('-------------------------------------------------');
		}	

		//ONLY DEAL WITH APP SHELL CACHE OR IF REQUEST IS FROM A CACHEABLE SOURCE...
		if(isRequestCacheable || isAppShellCache)
		{
			var cacheStore = (isAppShellCache) ? CURRENT_CACHES['app-shell'] : CURRENT_CACHES['app-data'];

			event.respondWith
			(
				fromCache(cacheStore, event.request).then((response) =>
				{
					// If there is an entry in the cache for event.request, then response will be defined
					// and we can just return it.			
					if (response)
					{
						console.log('RESPONSE FOUND FOR %s IN CACHE....', event.request.url);

						//NOW PULL REQUEST FROM NETWORK FOR LATEST CONTENT
						fromNetworkThenUpdateCache(cacheStore, event.request).then(sendRefreshMessage);

						return response;
					}		

					//AT THIS POINT, RESULTS DO NOT EXIST IN CACHE, SO RETRIEVE FROM NETWORK...
					return fromNetworkThenUpdateCache(cacheStore, event.request);			
				})
			);
		}
	}	
});



function fromCache(cacheStore, request) 
{
    return caches.open(cacheStore).then((cache) =>
	{
		//console.log('1. *********** FETCHING FROM CAHCE:', request.url);

		return cache.match(request);
	});
}

function fromNetworkThenUpdateCache(cacheStore, request) 
{
    return caches.open(cacheStore).then((cache) =>
	{
		//console.log('3. *********** CLIENT REQUEST:', request);
		
		return fetch(request).then((response) =>
		{			
			// Optional: add in extra conditions here, e.g. response.type == 'basic' to only cache
			// responses from the same domain. See https://fetch.spec.whatwg.org/#concept-response-type
			if (response.status < 400)
			{
				// We need to call .clone() on the response object to save a copy of it to the cache.
				// (https://fetch.spec.whatwg.org/#dom-request-clone)
				cache.put(request, response.clone());
			}	

			// Return the original response object, which will be used to fulfill the resource request.
			return response;														
		});
	});
}

//SEND NOTIFICATION THAT REQUEST HAS REFRESHED
//INCLUDES NEW CONTENT (jsonResults)
//SO CLIENT CAN COMPARE AND DETERMINE IF CONTENT FROM NETWORK HAS CHANGED
function sendRefreshMessage(response) 
{
	if(response)
	{
		try
		{
			responseClone = response.clone();

			if(responseClone.type === 'cors')
			{
				responseClone.json().then(jsonResults => 
				{
					var message = 
					{
						type: 'refresh',
						url: responseClone.url,
						content: jsonResults
					};

					console.log('SERVICE WORKER SEND responseClone:', responseClone);

					self.clients.matchAll().then((clients) =>
					{
						clients.forEach(client =>
						{
							client.postMessage(JSON.stringify(message));
						});
					});			
				});
			}
		}
		catch(exception)
		{
			console.log('***** EXCEPTION ***** ', exception);
		}
	}
}