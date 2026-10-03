let showWelcomeIntro = true;
try {
    showWelcomeIntro = sessionStorage.getItem("storycenter-welcome-seen") !== "true";
    if (showWelcomeIntro) sessionStorage.setItem("storycenter-welcome-seen", "true");
} catch (error) {
    console.warn("The welcome intro could not save its session state.", error);
}

if (showWelcomeIntro) {
    const welcomeIntro = document.createElement("dialog");
    welcomeIntro.className = "sc-welcome";
    welcomeIntro.setAttribute("aria-labelledby", "sc-welcome-title");
    welcomeIntro.innerHTML = `
        <div class="sc-welcome-stage">
            <span class="sc-welcome-orbit sc-welcome-orbit-one" aria-hidden="true"></span>
            <span class="sc-welcome-orbit sc-welcome-orbit-two" aria-hidden="true"></span>
            <span class="sc-welcome-mark" aria-hidden="true">S<span>.</span></span>
            <p class="sc-welcome-brand">ST<span>O</span>RYCENTER</p>
            <p class="sc-welcome-tagline">Listen deeply. Tell stories.</p>
            <span class="sc-welcome-rule" aria-hidden="true"></span>
            <p class="sc-welcome-eyebrow">A space to be heard</p>
            <h1 id="sc-welcome-title">Welcome to a world of stories.</h1>
            <p class="sc-welcome-copy">Every voice carries a world. We are glad you are here.</p>
            <button class="sc-welcome-skip" type="button">Skip intro <span aria-hidden="true">↗</span></button>
        </div>
    `;
    document.body.append(welcomeIntro);

    let welcomeExitTimer;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitDuration = reducedMotion ? 80 : 450;
    const dismissWelcome = () => {
        if (!welcomeIntro.open || welcomeIntro.classList.contains("is-leaving")) return;
        window.clearTimeout(welcomeExitTimer);
        welcomeIntro.classList.add("is-leaving");
        window.setTimeout(() => welcomeIntro.close(), exitDuration);
    };

    welcomeIntro.addEventListener("cancel", (event) => {
        event.preventDefault();
        dismissWelcome();
    });
    welcomeIntro.querySelector(".sc-welcome-skip").addEventListener("click", dismissWelcome);
    if (typeof welcomeIntro.showModal === "function") {
        welcomeIntro.showModal();
    } else {
        welcomeIntro.setAttribute("open", "");
    }
    welcomeExitTimer = window.setTimeout(dismissWelcome, reducedMotion ? 850 : 1850);
}

const menuButton = document.querySelector(".sc-menu");
const siteNavigation = document.querySelector(".sc-nav");

if (document.body.classList.contains("inner-page")) {
    const socialLinks = [
        ["YouTube", "https://www.youtube.com/user/CenterOfTheStory", "▶"],
        ["Facebook", "https://www.facebook.com/StoryCenter", "f"],
        ["Instagram", "https://www.instagram.com/storycenter/", "◎"],
        ["LinkedIn", "https://www.linkedin.com/company/storycenter", "in"]
    ];
    const socialRail = document.createElement("nav");
    socialRail.className = "sc-social-rail";
    socialRail.setAttribute("aria-label", "Follow StoryCenter");
    socialRail.innerHTML = '<span class="sc-social-caption">Follow the story</span>';
    socialLinks.forEach(([name, url, icon]) => {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `StoryCenter on ${name}`);
        link.title = name;
        link.textContent = icon;
        socialRail.append(link);
    });
    document.querySelector(".sc-header")?.after(socialRail);

    const backToTopLink = document.createElement("a");
    backToTopLink.className = "inner-back-top";
    backToTopLink.href = "#main-content";
    backToTopLink.setAttribute("aria-label", "Back to top");
    backToTopLink.textContent = "↑";
    document.body.append(backToTopLink);
}

if (menuButton && siteNavigation) {
    menuButton.addEventListener("click", () => {
        const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isExpanded));
        siteNavigation.classList.toggle("is-open", !isExpanded);
    });

    siteNavigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            menuButton.setAttribute("aria-expanded", "false");
            siteNavigation.classList.remove("is-open");
        }
    });
}

const homeHeader = document.querySelector(".home-page .sc-header");
const backToTop = document.querySelector(".home-back-top");
let homeScrollTicking = false;

if (homeHeader || backToTop || document.body.classList.contains("home-page") || document.body.classList.contains("inner-page")) {
    const updateHomeScroll = () => {
        homeScrollTicking = false;
        const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableDistance > 0 ? window.scrollY / scrollableDistance : 0;
        document.documentElement.style.setProperty("--home-scroll-progress", String(Math.min(1, Math.max(0, progress))));
        homeHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
        backToTop?.classList.toggle("is-visible", window.scrollY > 500);
        document.querySelector(".inner-page .sc-header")?.classList.toggle("is-scrolled", window.scrollY > 16);
        document.querySelector(".inner-back-top")?.classList.toggle("is-visible", window.scrollY > 500);
    };
    const scheduleHomeScrollUpdate = () => {
        if (!homeScrollTicking) {
            homeScrollTicking = true;
            window.requestAnimationFrame(updateHomeScroll);
        }
    };

    window.addEventListener("scroll", scheduleHomeScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleHomeScrollUpdate);
    updateHomeScroll();
}

const homeCarousel = document.querySelector("[data-home-carousel]");
const heroSlides = homeCarousel ? [...homeCarousel.querySelectorAll("[data-home-slide]")] : [];
const heroDots = homeCarousel ? [...homeCarousel.querySelectorAll("[data-carousel-go]")] : [];
const carouselToggle = homeCarousel?.querySelector("[data-carousel-toggle]");
const heroVideo = homeCarousel?.querySelector(".home-hero-video");

if (homeCarousel && heroSlides.length > 1 && heroDots.length === heroSlides.length) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeSlide = 0;
    let carouselTimer;
    let isPaused = reduceMotion.matches;

    const updatePauseControl = () => {
        if (!carouselToggle) return;
        carouselToggle.setAttribute("aria-label", isPaused ? "Play automatic slides" : "Pause automatic slides");
        carouselToggle.querySelector("span").textContent = isPaused ? "▶" : "Ⅱ";
    };
    const stopCarousel = () => {
        window.clearInterval(carouselTimer);
        carouselTimer = undefined;
    };
    const startCarousel = () => {
        stopCarousel();
        if (isPaused || document.hidden || homeCarousel.matches(":hover") || homeCarousel.contains(document.activeElement)) return;
        carouselTimer = window.setInterval(() => showSlide(activeSlide + 1), 7000);
    };
    const showSlide = (nextIndex) => {
        activeSlide = (nextIndex + heroSlides.length) % heroSlides.length;
        heroSlides.forEach((slide, index) => {
            const isActive = index === activeSlide;
            slide.classList.toggle("is-active", isActive);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.inert = !isActive;
        });
        heroDots.forEach((dot, index) => {
            const isActive = index === activeSlide;
            dot.classList.toggle("is-active", isActive);
            dot.setAttribute("aria-pressed", String(isActive));
        });
        const currentCount = homeCarousel.querySelector("[data-carousel-current]");
        if (currentCount) currentCount.textContent = String(activeSlide + 1).padStart(2, "0");
    };
    const togglePlayback = () => {
        isPaused = !isPaused;
        if (isPaused) {
            stopCarousel();
            heroVideo?.pause();
        } else {
            if (heroVideo && !heroVideo.dataset.failed) {
                heroVideo.play().catch(() => {
                    heroVideo.dataset.failed = "true";
                });
            }
            startCarousel();
        }
        updatePauseControl();
    };

    homeCarousel.querySelector("[data-carousel-prev]")?.addEventListener("click", () => {
        showSlide(activeSlide - 1);
        startCarousel();
    });
    homeCarousel.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
        showSlide(activeSlide + 1);
        startCarousel();
    });
    heroDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
            startCarousel();
        });
    });
    carouselToggle?.addEventListener("click", togglePlayback);
    homeCarousel.addEventListener("mouseenter", stopCarousel);
    homeCarousel.addEventListener("mouseleave", startCarousel);
    homeCarousel.addEventListener("focusin", stopCarousel);
    homeCarousel.addEventListener("focusout", (event) => {
        if (!homeCarousel.contains(event.relatedTarget)) startCarousel();
    });
    document.addEventListener("visibilitychange", startCarousel);
    reduceMotion.addEventListener("change", (event) => {
        if (event.matches) {
            isPaused = true;
            stopCarousel();
            heroVideo?.pause();
        }
        updatePauseControl();
        startCarousel();
    });
    heroVideo?.addEventListener("error", () => {
        heroVideo.dataset.failed = "true";
    });

    updatePauseControl();
    showSlide(0);
    if (!isPaused && heroVideo) {
        heroVideo.play().catch(() => {
            heroVideo.dataset.failed = "true";
        });
    }
    startCarousel();
}

document.querySelectorAll(".sc-announcement-close").forEach((button) => {
    button.addEventListener("click", () => button.closest(".sc-announcement").remove());
});

document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = form.querySelector(".sc-form-status");
        status.textContent = "Thanks — this is a demo, so your information was not sent.";
        form.reset();
    });
});

const workshopFilterButtons = document.querySelectorAll("[data-workshop-filter]");
const workshopCards = document.querySelectorAll("[data-workshop-card]");
const workshopGrid = document.querySelector(".home-workshop-grid");
const workshopFilterStatus = document.querySelector(".home-filter-status");

if (workshopFilterButtons.length && workshopCards.length && workshopGrid && workshopFilterStatus) {
    workshopFilterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedFilter = button.dataset.workshopFilter;
            let visibleCount = 0;

            workshopFilterButtons.forEach((filterButton) => {
                const isSelected = filterButton === button;
                filterButton.classList.toggle("is-active", isSelected);
                filterButton.setAttribute("aria-pressed", String(isSelected));
            });

            workshopCards.forEach((card) => {
                const isVisible = selectedFilter === "all" || card.dataset.workshopCategory === selectedFilter;
                card.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
            });

            workshopGrid.classList.toggle("is-filtered", selectedFilter !== "all");
            workshopFilterStatus.textContent = selectedFilter === "all"
                ? `Showing all ${visibleCount} workshop highlights`
                : `Showing ${visibleCount} ${visibleCount === 1 ? "workshop" : "workshops"}`;
        });
    });
}

const revealTargets = document.querySelectorAll(
    ".sc-card, .sc-photo-card, .sc-quote, .sc-split > *, .sc-heading, .sc-subhero .sc-wrap, .sc-page-hero-content, .sc-hero-note, .sc-cta-inner > *, .sc-form, .sc-hero-copy, .story-feature, .story-listen-inner > *, .story-process-grid > *, .about-principles-grid > *, .about-journey-grid > *, .contact-email-card, .contact-address-card, .contact-faq-list > *, .home-intro-grid > *, .home-offering, .home-process-heading > *, .home-process-card, .home-workshop-featured, .home-workshop-mini, .home-impact-inner > *, .home-impact-grid > *, .home-facilitator-grid > *, .home-newsletter-inner > *, .home-quote-inner > *"
);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
    revealTargets.forEach((element) => {
        element.classList.add("sc-reveal");
    });

    const revealVisibleElements = () => {
        revealTargets.forEach((element) => {
            const bounds = element.getBoundingClientRect();
            if (bounds.top < window.innerHeight * 0.92) {
                element.classList.add("is-visible");
            }
        });
    };

    window.addEventListener("scroll", revealVisibleElements, { passive: true });
    window.addEventListener("resize", revealVisibleElements);
    revealVisibleElements();
} else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
}
