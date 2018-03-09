if ! [ -a /usr/local/bin/browserify ]; then
npm install -g browserify
fi

browserify src/index.js -do build/index.js
