function Navigation() {
    const hero = document.querySelector(".hero")
    const nav = document.querySelector(".main-nav")

    const observer = new IntersectionObserver( 
      ([entry]) => {
        nav.toggleAttribute('small', entry.intersectionRatio < 0.8)
        setTimeout(() => nav.toggleAttribute('animated', true), 100)
      },
      { threshold: [0.8] }
    );
  

  return {
    start() {
      observer.observe(hero);
      window.addEventListener('scroll', () => {
          nav.toggleAttribute('shadow', document.scrollingElement.scrollTop > 0)
      })
    }
  }
}

function SlideBackgroundParallax() {
  return {
    start() {
      window.addEventListener('scroll', () => {  
        const scrolltotop = document.scrollingElement.scrollTop;
        const target = document.querySelector(".slide[active] .background");
        target.style.backgroundPosition = `center ${scrolltotop * 0.5}px`
      })    
    }
  }
}

function CarouselNavigation() {
    const nextButton = document.querySelector('.navigate[next]')
    const previousButton = document.querySelector('.navigate[previous]')
    const hero = document.querySelector(".hero")

    return {
      start() {
        nextButton.addEventListener('click', next)
        
        previousButton.addEventListener('click', previous)
      }
    } 

  function next() {
    const active = document.querySelector('.slide[active]')
    let next = active;
    do {
        next = next?.nextElementSibling ?? hero?.firstElementChild
    } while(!next.classList.contains('slide'))
    active?.toggleAttribute('active', false)
    next?.toggleAttribute('active', true)
  }

  function previous() {
    const active = document.querySelector('.slide[active]')
    let previous = active;
    do {
      previous = previous?.previousElementSibling ?? hero?.lastElementChild
    } while(!previous.classList.contains('slide'))
    active?.toggleAttribute('active', false)
    previous?.toggleAttribute('active', true)
  }
}

Navigation().start()
SlideBackgroundParallax().start()
CarouselNavigation().start()