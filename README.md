Не забудьте выполнить
npm install
cd renderer
bower install

Документация из локальной директории
node index.js -p ~/work/projects/www/front/croc.js -o ../docv

Другая ветка
node index.js -p ~/work/projects/www/front/croc.js -b issue6513 -o ../docv

Документация из гита
node index.js -g ssh://gitlab@gitlab.sotmarket.ru:522/front-office/www.git -p front/croc.js -o ../docv