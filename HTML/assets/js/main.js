/*
		ARRAY SORT FUNCTIONS

		SORT AN ARRAY ASCENDING OR DESCENDING

		REFER TO:
		http://stackoverflow.com/a/10124053/418549

		sortBy function uses Schwartzian transform (https://en.wikipedia.org/wiki/Schwartzian_transform) on all arrays

		*/


		//SORT ASC:
		(function(){
		if (typeof Object.defineProperty === 'function'){
			try{Object.defineProperty(Array.prototype,'sortBy',{value:sb}); }catch(e){}
		}
		if (!Array.prototype.sortBy) Array.prototype.sortBy = sb;

		function sb(f)
		{
			for (var i=this.length;i;)
			{
				var o = this[--i];
				this[i] = [].concat(f.call(o,o,i),o);
			}

			this.sort(function(a,b)
			{
				for (var i=0,len=a.length;i<len;++i)
				{
					if (a[i]!=b[i]) return a[i]<b[i]?-1:1;
				}
				return 0;
			});

			for (var i=this.length;i;)
			{
				this[--i]=this[i][this[i].length-1];
			}

			return this;
		}
		})();


		//SORT DESC:
		(function(){
			if (typeof Object.defineProperty === 'function'){
				try{Object.defineProperty(Array.prototype,'sortByDesc',{value:sbDesc}); }catch(e){}
			}
			if (!Array.prototype.sortBy) Array.prototype.sortBy = sbDesc;

			function sbDesc(f)
			{
				for (var i=this.length;i;)
				{
					var o = this[--i];
					this[i] = [].concat(f.call(o,o,i),o);
				}

				this.sort(function(a,b)
				{
					for (var i=0,len=a.length;i<len;++i)
					{
						if (a[i]!=b[i]) return a[i]>b[i]?-1:1;
					}
					return 0;
				});

				for (var i=this.length;i;)
				{
					this[--i]=this[i][this[i].length-1];
				}

				return this;
			}
		})();

/*
		//LOAD SERVICE WORKER...
		if ('serviceWorker' in navigator) 
		{
			navigator.serviceWorker.register('service-worker.js')
			.then
			(
				function(registration) 
				{
					console.log('Service Worker registered sparky', registration);
				}
			)
			.catch
			(
				function(err) 
				{
					console.log('Service Worker registration failed yo: ', err);
				}
			);
		}
*/