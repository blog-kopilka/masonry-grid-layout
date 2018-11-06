/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
	// Вычисляет смещение сверху или слева от элемента относительно видового экрана 
	// (не считая преобразований, которые может иметь элемент)
	const getOffset = (elem, axis) => {
		let offset = 0;
		const type = axis === 'top' ? 'offsetTop' : 'offsetLeft';
		do {
			if ( !isNaN( elem[type] ) )
			{
				offset += elem[type];
			}
		} while( elem = elem.offsetParent );
		return offset;
	}
	// Вычисляем расстояние между двумя точками
	const distance = (p1,p2) => Math.hypot(p2.x-p1.x, p2.y-p1.y);

	// Получаем рандомное число
	const randNumber = (min,max) => Math.floor(Math.random() * (max - min + 1)) + min;

	// Получаем положение мыши. Взято от сюда: http://www.quirksmode.org/js/events_properties.html#position
	const getMousePos = (e) => {
		let posx = 0;
		let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	};

	// Возвращает угол поворота элемента.
	const getAngle = (el) => {
		const st = window.getComputedStyle(el, null);
		const tr = st.getPropertyValue('transform');
		let values = tr.split('(')[1];
		values = values.split(')')[0];
		values = values.split(',');
		return Math.round(Math.asin(values[1]) * (180/Math.PI));
	};

	//Функции управления прокруткой. Взято из https://stackoverflow.com/a/4770179
	const keys = {37: 1, 38: 1, 39: 1, 40: 1};
	const preventDefault = (e) => {
		e = e || window.event;
		if (e.preventDefault)
			e.preventDefault();
		e.returnValue = false;  
	}
	const preventDefaultForScrollKeys = (e) => {
		if (keys[e.keyCode]) {
			preventDefault(e);
			return false;
		}
	}
	const disableScroll = () => {
		if (window.addEventListener) // для старых FF
			window.addEventListener('DOMMouseScroll', preventDefault, false);
		window.onwheel = preventDefault; // современный стандарт
		window.onmousewheel = document.onmousewheel = preventDefault; // старые браузеры, IE
		window.ontouchmove  = preventDefault; // мобилка
		document.onkeydown  = preventDefaultForScrollKeys;
	}
	const enableScroll = () => {
		if (window.removeEventListener)
			window.removeEventListener('DOMMouseScroll', preventDefault, false);
		window.onmousewheel = document.onmousewheel = null; 
		window.onwheel = null; 
		window.ontouchmove = null;  
		document.onkeydown = null;  
	}
	
	// класс для работы с сеткой
    class GridItem {
        constructor(el) {
			this.DOM = {el: el};
			// Обертка для элемента вокруг изображения.
			this.DOM.bg = this.DOM.el.querySelector('.grid__item-bg');

			// Следующие элементы DOM-это элементы, которые будут перемещаться / наклоняться при наведении на элемент.
			this.DOM.tilt = {};

			// Работа с картинкой.
			this.DOM.imgWrap = this.DOM.el.querySelector('.grid__item-wrap');
			this.DOM.tilt.img = this.DOM.imgWrap.querySelector('img');

			// Вертикальный заголовок
			this.DOM.tilt.title = this.DOM.el.querySelector('.grid__item-title');

			// Горизонтальный заголовок
			this.DOM.tilt.number = this.DOM.el.querySelector('.grid__item-number');
			
			// Разбиваем горизонтальный заголовок на много спанов, используем библиотетку charming.js
			charming(this.DOM.tilt.number);

			// И получаем наши "буквы"
			this.DOM.numberLetters = this.DOM.tilt.number.querySelectorAll('span');

			// Настройка при перемещении / наклоне элементов при наведении.
			this.tiltconfig = {   
                title: {translation : {x: [-8,8], y: [4,-4]}},
                number: {translation : {x: [-5,5], y: [-10,10]}},
                img: {translation : {x: [-15,15], y: [-10,10]}}
			};
			
			// Получить значение угла поворота элемента изображения.
			// Это будет использоваться для поворота модели DOM.bg к тому же значению при расширении / открытии элемента.
			this.angle = getAngle(this.DOM.tilt.img);

			// Запускаем функцию initEvents
            this.initEvents();
		}
		initEvents() {
			/**
			 * При наведении мыши: 
			 * - Масштабирование модели DOM.bg элемент.
			 * - Анимация букв.
			 * 
			 * Движение мыши: 
			 * - наклон - движение как букв, картинки, так и заголовка
			 * 
			 * 
			 * Выход мыши за приделы обьекта: 
			 * - Возврат масштаба Dom.bg элемента
			 * - Анимация букв.
			 */
			this.toggleAnimationOnHover = (type) => {
				// Масштабирование bg элемента
				TweenMax.to(this.DOM.bg, 1, {
					ease: Expo.easeOut,
					scale: type === 'mouseenter' ? 1.15 : 1
				});
				// Анимация букв
				this.DOM.numberLetters.forEach((letter,pos) => {
					TweenMax.to(letter, .2, {
						ease: Quad.easeIn,
						delay: pos*.1,
						y: type === 'mouseenter' ? '-50%' : '50%',
						opacity: 0,
						onComplete: () => {
							TweenMax.to(letter, type === 'mouseenter' ? 0.6 : 1, {
								ease: type === 'mouseenter' ? Expo.easeOut : Elastic.easeOut.config(1,0.4),
								startAt: {y: type === 'mouseenter' ? '70%' : '-70%', opacity: 0},
								y: '0%',
								opacity: 1
							});
						}
					});
				});
			};
			this.mouseenterFn = (ev) => {
				if ( !allowTilt ) return;
				this.toggleAnimationOnHover(ev.type);
            };
            this.mousemoveFn = (ev) => requestAnimationFrame(() => {
				if ( !allowTilt ) return;
                this.tilt(ev);
            });
            this.mouseleaveFn = (ev) => {
				if ( !allowTilt ) return;
				this.resetTilt();
				this.toggleAnimationOnHover(ev.type);
            };
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
		}
		tilt(ev) {
			// Получаю положение мыши
			const mousepos = getMousePos(ev);
            // Прокрутка документа.
            const docScrolls = {left : body.scrollLeft + docEl.scrollLeft, top : body.scrollTop + docEl.scrollTop};
            const bounds = this.DOM.el.getBoundingClientRect();
            // Положение мыши относительно основного элемента (this.DOM.el).
            const relmousepos = {
                x : mousepos.x - bounds.left - docScrolls.left, 
                y : mousepos.y - bounds.top - docScrolls.top 
            };
            // Настройки перемещения элементов наклона.
            for (let key in this.DOM.tilt) {
				let t = this.tiltconfig[key].translation;
				// Анимируем каждый элемент
                TweenMax.to(this.DOM.tilt[key], 2, {
                    ease: Expo.easeOut,
                    x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                    y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                });
            }
		}
		resetTilt() {
			for (let key in this.DOM.tilt ) {
                TweenMax.to(this.DOM.tilt[key], 2, {
					ease: Elastic.easeOut.config(1,0.4),
                    x: 0,
                    y: 0
                });
            }
		}
		/**
		 * Скрываем элементы
		 * - Изменение размера и затухание изображения и элементов на заднем фоне
		 * - Перемещение вниз и затухание заголовка и цифр
		 */
		hide(withAnimation = true) { this.toggle(withAnimation,false); }
		/**
		 * Сброс.
		 */
		show(withAnimation = true) { this.toggle(withAnimation); }
		toggle(withAnimation, show = true) {
			TweenMax.to(this.DOM.tilt.img, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0.15 : 0,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0,
			});
			TweenMax.to(this.DOM.bg, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0 : 0.15,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0
			});
			this.toggleTexts(show ? 0.45 : 0, withAnimation, show);
		}
		// скрываем текст (Анимация вниз и затухание).
		hideTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation, false); }
		// показываем тексты (сброс анимации и плавное появление).
		showTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation); }
		toggleTexts(delay, withAnimation, show = true) {
			TweenMax.to([this.DOM.tilt.title, this.DOM.tilt.number], !withAnimation ? 0 : show ? 1 : 0.5, {
				ease: show ? Expo.easeOut : Quart.easeIn,
				delay: !withAnimation ? 0 : delay,
				y: show ? 0 : 20,
				opacity: show ? 1 : 0
			});
		}
	}

	// Класс содержимого. Represents one content item per grid item. Представляет элемент содержимого сетки
    class Content {
        constructor(el) {
			this.DOM = {el: el};
			// Элементы: изображение, заголовок, подзаголовок и текст.
            this.DOM.img = this.DOM.el.querySelector('.content__item-img');
            this.DOM.title = this.DOM.el.querySelector('.content__item-title');
            this.DOM.subtitle = this.DOM.el.querySelector('.content__item-subtitle');
			this.DOM.text = this.DOM.el.querySelector('.content__item-text');
			// Делит заголовок на span'ы, используя библиотеку charming.js
			charming(this.DOM.title);
			// И получаем доступ к span (буквам)
			this.DOM.titleLetters = this.DOM.title.querySelectorAll('span');
			this.titleLettersTotal = this.DOM.titleLetters.length;
		}
		/**
		 * Показаем / скрываем элементы (заголовоки, подзаголовки и текст).
		 */
        show(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation); }
        hide(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation, false); }
		toggle(delay, withAnimation, show = true) {
			setTimeout(() => {
				
				this.DOM.titleLetters.forEach((letter,pos) => {
					TweenMax.to(letter, !withAnimation ? 0 : show ? .6 : .3, {
						ease: show ? Back.easeOut : Quart.easeIn,
						delay: !withAnimation ? 0 : show ? pos*.05 : (this.titleLettersTotal-pos-1)*.04,
						startAt: show ? {y: '50%', opacity: 0} : null,
						y: show ? '0%' : '50%',
						opacity: show ? 1 : 0
					});
				});
				this.DOM.subtitle.style.opacity = show ? 1 : 0;
				this.DOM.text.style.opacity = show ? 1 : 0;

			}, withAnimation ? delay*1000 : 0 );
		}
    }

	// Сетка.
    class Grid {
        constructor(el) {
			this.DOM = {el: el};
			// обертка
			this.DOM.gridWrap = this.DOM.el.parentNode;
			// элементы
            this.items = [];
            Array.from(this.DOM.el.querySelectorAll('.grid__item')).forEach(itemEl => this.items.push(new GridItem(itemEl)));
            // Суммарное количество элементов
			this.itemsTotal = this.items.length;
			// Содержимое элементов
			this.contents = [];
			Array.from(document.querySelectorAll('.content > .content__item')).forEach(contentEl => this.contents.push(new Content(contentEl)));
			// Back control and scroll indicator (elements shown when the item´s content is open). Кнопка закрытия и scroll (показываем элементы, когда контентент в режиме open)
			this.DOM.closeCtrl = document.querySelector('.content__close');
			this.DOM.scrollIndicator = document.querySelector('.content__indicator');
			// Отрываем элемент сетки
			this.current = -1;
            // Инициализируем / привязываем события
            this.initEvents();
		}
		initEvents() {
			// Клик по элементу сетки, прячет все остальные элементы (упорядоченны по близости к нажатому).
			// и разворачивает/открывает тот, по которому был совершен клик 
			for (let item of this.items) {
				item.DOM.el.addEventListener('click', (ev) => {
					ev.preventDefault();
					this.openItem(item);
				});
			}
			// Закрытие элемента
			this.DOM.closeCtrl.addEventListener('click', () => this.closeItem());
			// Незакончено! Сейчас: если есть открытый элемент, то показываем сетку.
			this.resizeFn = () => {
				if (this.current === -1 || winsize.width === window.innerWidth) return;
				this.closeItem(false);
			};
			window.addEventListener('resize', this.resizeFn);
		}
		getSizePosition(el, scrolls = true) {
			const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    		const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
			return {
				width: el.offsetWidth,
				height: el.offsetHeight,
				left: scrolls ? getOffset(el, 'left')-scrollLeft : getOffset(el, 'left'),
				top: scrolls ? getOffset(el, 'top')-scrollTop : getOffset(el, 'top')
			};
		}
		openItem(item) {
			if ( this.isAnimating ) return;
			this.isAnimating = true;
			// Получаем текущую позицию прокрутки.
			this.scrollPos = window.scrollY;
			// Отключаем прокрутку страниц.
			disableScroll();
			// Отключаем наклон.
			allowTilt = false;
			// Задаем текущее значение (индекс выбранного элемента).
			this.current = this.items.indexOf(item);
			// Скрываю все элементы сетки, кроме того, который мы хотим открыть.
			this.hideAllItems(item);
			// Также скрываю элементы текста.
			item.hideTexts();
			// Устанавливаю для элементов самый высокий z-index, чтобы они перекрывали любой другой элемент сетки
			item.DOM.el.style.zIndex = 1000;
			// Получаю ширину и высоту" grid__item-bg " и задать ее явно,
			// Также установливаю его top и left соответственно странице.
			const itemDim = this.getSizePosition(item.DOM.el);
			item.DOM.bg.style.width = `${itemDim.width}px`;
			item.DOM.bg.style.height = `${itemDim.height}px`;
			item.DOM.bg.style.left = `${itemDim.left}px`;
			item.DOM.bg.style.top = `${itemDim.top}px`;
			// Устанавливаю position: fixed
			item.DOM.bg.style.position = 'fixed';
			// Рассчитываем диагональ окна просмотра. Это нужно будет учитывать при масштабировании элемента items bg.
			const d = Math.hypot(winsize.width, winsize.height);
			// Масштабирование элемента item bg
			TweenMax.to(item.DOM.bg, 1.2, {
				ease: Expo.easeInOut,
				delay: 0.4,
				x: winsize.width/2 - (itemDim.left+itemDim.width/2),
				y: winsize.height/2 - (itemDim.top+itemDim.height/2),
				scaleX: d/itemDim.width,
				scaleY: d/itemDim.height,
				rotation: -1*item.angle*2
			});
			// Получаю контент элемента соответсвующего текущему элементу сетки
			const contentEl = this.contents[this.current];
			// Задаю класс current
			contentEl.DOM.el.classList.add('content__item--current');
			// Расчитываю размеры и позиции элементов изображения и контента
			// Нам это нужно, чтобы мы могли масштабировать и переводить изображение элементов в тот же размер и положение
			const imgDim = this.getSizePosition(item.DOM.imgWrap);
			const contentImgDim = this.getSizePosition(contentEl.DOM.img, false);
			// Показываем кнопку "назад" и индикатор прокрутки и все элементы контента (1 секунда задрежки)
			this.showContentElems(contentEl, 1);
			// Анимаруем изображение элемента
			TweenMax.to(item.DOM.tilt.img, 1.2, {
				ease: Expo.easeInOut,
				delay: 0.55,
				scaleX: contentImgDim.width/imgDim.width,
				scaleY: contentImgDim.height/imgDim.height,
				x: (contentImgDim.left+contentImgDim.width/2)-(imgDim.left+imgDim.width/2),
				y: (contentImgDim.top+contentImgDim.height/2)-(imgDim.top+imgDim.height/2),
				rotation: 0,
				onComplete: () => {
					// Скрываем изображение элемента и показываем изображение содержимого. Они должны перекрываться
					item.DOM.tilt.img.style.opacity = 0;
					contentEl.DOM.img.style.visibility = 'visible';
					// Главной контентной обертке устанавливаем poosition: absolute 
					contentEl.DOM.el.parentNode.style.position = 'absolute';
					// Прячем scroll у сетки
					this.DOM.gridWrap.classList.add('grid-wrap--hidden');
					// Поднимаем страницу (скроллим вверх)
					window.scrollTo(0, 0);
					// Разрешаем скролл страницы
					enableScroll();
					this.isAnimating = false;
				}
			});
		}
		closeItem(withAnimation = true) {
			if ( this.isAnimating ) return;
			this.isAnimating = true;
			// Получаю контент элемента, соответствующего этому элементу сетки.
			const contentEl = this.contents[this.current];
			// Скроллим до предыдущей позиции перед открытием элемента.
			window.scrollTo(0, this.scrollPos);
			contentEl.DOM.el.parentNode.style.position = 'fixed';
			// Отключаем прокрутку страницы
			disableScroll();
			// Показываю скролл сетки
			this.DOM.gridWrap.classList.remove('grid-wrap--hidden');
			// Открытый элемент
			const item = this.items[this.current];
			// Скрываю кнопку назад, индикатор прокрутки и весь контент элемента
			this.hideContentElems(contentEl, 0, withAnimation);
			// Установите изображение сетки обратно (opacity: 1)
			item.DOM.tilt.img.style.opacity = 1;
			contentEl.DOM.img.style.visibility = 'hidden';
			// Анимация изображения сетки обратно
			TweenMax.to(item.DOM.tilt.img, withAnimation ? 1.2 : 0, {
				ease: Expo.easeInOut,
				scaleX: 1,
				scaleY: 1,
				x: 0,
				y: 0,
				rotation: item.angle*2
			});
			// И тоже самое с задним фоном
			TweenMax.to(item.DOM.bg, withAnimation ? 1.2 : 0, {
				ease: Expo.easeInOut,
				delay: 0.15,
				x: 0,
				y: 0,
				scaleX: 1,
				scaleY: 1,
				rotation: 0,
				onComplete: () => {
					contentEl.DOM.el.classList.remove('content__item--current');
					item.DOM.bg.style.position = 'absolute';
					item.DOM.bg.style.left = '0px';
					item.DOM.bg.style.top = '0px';
					this.current = -1;
					allowTilt = true;
					item.DOM.el.style.zIndex = 0;
					enableScroll();
					this.isAnimating = false;
				}
			});
			// Показываем все элементы, кроме того который мы хотим скрыть
			this.showAllItems(item, withAnimation);
			// Также показываем тексты элемента (1 секунда задержки)
			item.showTexts(1, withAnimation);
		}
		/**
		 * Переключение элементов контента.
		 */
		showContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation); }
		hideContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation, false); }
		toggleContentElems(contentEl, delay, withAnimation, show = true) {
			// Переключение кнопки назад и индикатора прокрутки
			TweenMax.to([this.DOM.closeCtrl, this.DOM.scrollIndicator], withAnimation ? 0.8 : 0, {
				ease: show ? Expo.easeOut : Expo.easeIn,
				delay: withAnimation ? delay : 0,
				startAt: show ? {y: 60} : null,
				y: show ? 0 : 60,
				opacity: show ? 1 : 0
			});
			if ( show ) {
				contentEl.show(delay, withAnimation);
			}
			else {
				contentEl.hide(delay, withAnimation);
			}
		}
		// Взято с https://stackoverflow.com/q/25481717
		sortByDist(refPoint, itemsArray) {
			let distancePairs = [];
			let output = [];
	
			for(let i in itemsArray) {
				const rect = itemsArray[i].DOM.el.getBoundingClientRect();
				distancePairs.push([distance(refPoint,{x:rect.left+rect.width/2, y:rect.top+rect.height/2}), i]);
			}
	
			distancePairs.sort((a,b) => a[0]-b[0]);
	
			for(let p in distancePairs) {
				const pair = distancePairs[p];
				output.push(itemsArray[pair[1]]);
			}
	
			return output;
		}
		/**
		 * Показывает / скрывает все элементы сетки, кроме "исключенного" элемента.
		 * Элементы будут отсортированы на основе расстояния до элемента исключения.
		 */
		showAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation); }
		hideAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation, false); }
		toggleAllItems(exclude, withAnimation, show = true) {
			if ( !withAnimation ) {
				this.items.filter(item => item != exclude).forEach((item, pos) => item[show ? 'show' : 'hide'](withAnimation));
			}
			else {
				const refrect = exclude.DOM.el.getBoundingClientRect(); 
				const refPoint = {
					x: refrect.left+refrect.width/2, 
					y: refrect.top+refrect.height/2
				};
				this.sortByDist(refPoint, this.items.filter(item => item != exclude))
					.forEach((item, pos) => setTimeout(() => item[show ? 'show' : 'hide'](), show ? 300+pos*70 : pos*70));
			}
		}
	}

	// Управляет тем, будет ли элемент иметь "наклон" при наведении (mousemove) или нет.
	let allowTilt = true;
	
	// Кэширование некоторых вещей..
	const body = document.body;
	const docEl = document.documentElement;
	
	// Размеры окна
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

	// Инициализация сетки
	const grid = new Grid(document.querySelector('.grid'));

	// Предзагрузка картинок
	imagesLoaded(document.querySelectorAll('.grid__item-img'), () => {
		body.classList.remove('loading');
		var msnry = new Masonry( grid.DOM.el, {
			// Настройки
			itemSelector: '.grid__item',
			columnWidth: 260,
			gutter: 100,
			fitWidth: true
		});
	});
}
