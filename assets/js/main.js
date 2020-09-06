if(!window.console) console = {};
if(!console.log) console.log = function() {};

$(function() {
	// presets

	seeds = [];
	getSeed();

	async function getSeed() {
		let res = await fetch('https://independentspaceindex.at/spaces.json')
		let data = await res.json()
		let seed = data[Math.floor(Math.random() * data.length)].name
		if (seedInfo = document.querySelector('#seed-info')) {
			seedInfo.innerText = seed
		}
		indexArgs.seed = seed
		init(indexArgs);
	}

	var indexArgs = {
		seed: 'Kevin Space',
		color: 'gradient',
		noiseFunction: 'simplex',
		smoothing: 'quintic',
		scale: 100,
		size: 119,
		octaves: 3,
		persistence: .69,
		lacunarity: 1,
		gradientStart: 'ff0000',
		gradientEnd: 'ffffff',
		independent: false,
		octaveFunction: 'absolute',
		customOctaveFunction: 'return n;',
		sumFunction: 'modular',
		customSumFunction: 'return n;',
		sineFrequencyCoeff: 1,
		modularAmplitude: 2.7
	};
	
	// canvas
	var canvas = document.getElementById('canvas');
	var context;
	
	// worker
	var noiseWorker = new Worker('./assets/js/noise.js');
	noiseWorker.addEventListener('message', function(e) {
	    switch(e.data.action) {
		    case 'updated': 
			context.putImageData(e.data.imageData, 0, 0);
			updateFinished(); 
			break;
		    case 'progress': 
			updateProgress(e.data.progress); 
			break;
		    case 'log':
			console.log.apply(console, e.data.args);
			break;
	    }
	}, false);
	noiseWorker.addEventListener('error', function(e) {
		console.log('noise error:', e);
		$('#update-error-message').text(e.message);
		updateFinished();
	}, false);
	
	// arguments
	function setArgs(args) {
		for(var key in args) {
			var value = args[key];
			$('#' + key).val(value);
		}
	}
	
	function collectArgs() {
		args = indexArgs;
		args.scale = parseFloat(args.scale);
		args.size = parseInt(args.size);
		args.octaves = parseInt(args.octaves);
		args.persistence = parseFloat(args.persistence);
		args.lacunarity = parseInt(args.lacunarity);
		args.sineFrequencyCoeff = parseFloat(args.sineFrequencyCoeff);
		args.modularAmplitude = parseFloat(args.modularAmplitude);
		args.independent = args.color != 'greyscale' && args.independent == 'true';
		return args;
	}
	
	// update
	function startUpdate() {
		// update the permalink
		// updatePermalink();
		
		updateProgress(0);
		var args = indexArgs;
		var imageData = context.createImageData(canvas.width, canvas.height);
		noiseWorker.postMessage({ 
			action: 'update',
			imageData: imageData,
			args: args,
		});
	}
	
	function updateFinished(imageData) {
		canvas.classList.add('visible')
		updateProgress(0);
	}
	
	var updatingProgress = false;
	function updateProgress(progress) {
		if(updatingProgress) return;
		updatingProgress = true;
		updatingProgress = false;
	}
	
	// download
	function downloadImage() {
		if(!canvas.toDataURL) {
			alert('cannot download: your browser doesn\'t support canvas.toDataURL');
			return;
		}
		document.location.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
	}
	
	// permalink
	function updatePermalink() {
		var args = collectArgs();
		var serialized = $.param(args);
		location.hash = '#' + serialized;
	}
	
	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		context = canvas.getContext('2d');
	}

	function resizedw(){
		init()
	}
	
	var doit;
	window.onresize = function() {
	  clearTimeout(doit);
	  doit = setTimeout(resizedw, 500);
	};
	
	// init
	var args = indexArgs;

	function init(args) {
		setArgs(args);
		resize();
		startUpdate();
	}
});

const toFormat = (elements) => {
	elements.forEach(head => {
		let text = head.innerText
		let length = text.length
		let numOfTerrorLetters = 10
		let numbers = [];
		while(numbers.length < numOfTerrorLetters){
			var r = Math.floor(Math.random() * length) + 1;
			if(numbers.indexOf(r) === -1) numbers.push(r);
		}
		let arr = text.split('')
		arr = arr.map(function(letter, i) {
			if (letter == "\n" || letter == "\r") {
				return letter = "<br>"
			}
			if (letter == "D") {
				return letter
			}
			else if (numbers.includes(i)) {
				return `<span class="terror">${letter}</span>`
			}
			else {
				return letter
			}
		})
		head.innerHTML = arr.join("")
	})
}