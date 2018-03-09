sh build.sh
git branch -D gh-pages
git checkout -b gh-pages
git rm -r src
git rm .gitignore build.sh package.json gh-pages.sh LICENSE README.md
git add build
git commit -m 'added build folder; removed unneeded files'
git push origin gh-pages --force
git checkout master
