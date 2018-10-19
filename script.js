(function () {
  'use strict';
  let input = document.getElementById('search');
  let timer = null;
  let blurTimer = null;
  
  // Fetch first 30 users based on search string
  const fetchUsers = (search_string) => {
    const username = 'username:e2c9d7d4f74f38115cce7e332117b81cb4f05dc2';
    const headers = {
      Authorization: username,
    }
    return fetch(`https://api.github.com/search/users?q=${search_string}+in:fullname+type:user`, headers)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(fetchedData => {
        const users = fetchedData.items;
        // If previous dropdown exists..
        removeDropdown();
        buildDropdown(document.querySelector('.search-container'), users);
      });
  }

  // fetch single user info by login to display additional data
  const fetchSingleUser = (login) => {
    const username = 'username:e2c9d7d4f74f38115cce7e332117b81cb4f05dc2';
    const headers = {
      Authorization: username,
    }
    return fetch(`https://api.github.com/users/${login}`, headers)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(fetchedData => {
        let user;
        if (fetchedData){
          const {avatar_url, bio, company, location, login, name} = fetchedData;
          user = {avatar_url, bio, company, location, login, name};
        }
        else {
          user = {
            avatar_url: '',
            'important info': 'This is dummy data. You see this, because fetching of single user information didn\'t work due to api calls limits.',
            bio: 'Default bio',
            company: 'One day - Google',
          }
        }
        showUserInfo(user);
      })
  }

  // Remove existing dropdown before building new one
  const removeDropdown = () => {
    const dropdown = document.getElementsByClassName('dropdown')[0];
    if (dropdown) {
      dropdown.parentNode.removeChild(dropdown);
    }
  }

  // Build new dropdown for form element populated with data from userList
  const buildDropdown = (form, userList) => {
    const dropdown = document.createElement('ul');
    var leftEdge = input.offsetLeft;
    dropdown.classList.add('dropdown');
    dropdown.setAttribute('style', `left: ${leftEdge}px`);

    userList.forEach( (user) => {
      const li = document.createElement('li');
      li.classList.add('dropdown-li');
      li.innerHTML = user.login;
      li.setAttribute('data-login', user.login);
      li.setAttribute('data-url', user.html_url);

      const avatar = document.createElement('img');
      avatar.setAttribute('src', user.avatar_url);
      avatar.classList.add('avatar')
      li.prepend(avatar);

      // Cover element to handle hover events
      const cover = document.createElement('div');
      cover.classList.add('cover');
      li.append(cover);
      dropdown.append(li);
    })

    dropdown.addEventListener('mouseover', (e) => {
      if (e.target && e.target.matches('.cover')) {
        const li = e.target.parentNode;
        toggleActiveClass(li);
        fetchSingleUser(li.getAttribute('data-login'));
      }
    })

    dropdown.addEventListener('click', (e) => {
      if (e.target && e.target.matches('.cover')) {
        let result = e.target.parentNode.textContent;
        let url = e.target.parentNode.getAttribute('data-url');
        updateInputField(result, url, form);
        hideUserInfo();
      }
    });
    // Add active class to the first li-element in dropdown
    dropdown.firstChild.classList.add('active');
    fetchSingleUser(dropdown.firstChild.getAttribute('data-login'));
    form.append(dropdown);
  }

  // Display container with additional user information
  const showUserInfo = (user) => {
    // Make sure to remove previous data before showing new one
    hideUserInfo();
    if (!user) {
      return undefined;
    }
    const userInfoContainer = document.createElement('div');
    userInfoContainer.classList.add('user-info-container');

    const avatar = document.createElement('img');
    avatar.setAttribute('src', user.avatar_url);
    avatar.classList.add('avatar-big');
    userInfoContainer.append(avatar);

    Object.keys(user).map(key => {
      if (key !== 'avatar_url' && user[key]) {
        const div = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = capitalize(key);
        span.classList.add('bio-key');
        div.textContent = ': ' + user[key];
        div.prepend(span);
        userInfoContainer.append(div);
      }
    })
    document.getElementById('main').append(userInfoContainer);
  }

  // Remove container with additional user information
  const hideUserInfo = () => {
    const userInfo = document.getElementsByClassName('user-info-container')[0];
    if (userInfo !== undefined) {
      userInfo.parentNode.removeChild(userInfo);
    }
  }

  // Handle navigation through dropdown with arrow-up and arrow-down
  input.addEventListener('keydown', (e) => {
    const activeLi = document.querySelector('.active');
    const dropdown = document.querySelector('.dropdown');
    const searchContainer = document.querySelector('.search-container');
    let nextActiveElement;
    let previousActiveElement;
    switch (e.keyCode) {
      // pressed 'down'
      case 40:
        if (!activeLi.nextSibling) {
          nextActiveElement = dropdown.childNodes[dropdown.childNodes.length - 1];
        }
        else {
          nextActiveElement = activeLi.nextSibling;
        }
        toggleActiveClass(nextActiveElement);
        if (nextActiveElement.offsetTop > dropdown.scrollTop + nextActiveElement.scrollHeight * 3) {
          dropdown.scrollTop = nextActiveElement.offsetTop - nextActiveElement.scrollHeight * 3;
        }
        fetchSingleUser(nextActiveElement.getAttribute('data-login'));
        break;
        // pressed 'up'
      case 38:
        if (!activeLi.previousSibling) {
          previousActiveElement = dropdown.childNodes[0];
        }
        else {
          previousActiveElement = activeLi.previousSibling;
        }
        toggleActiveClass(previousActiveElement);
        if (previousActiveElement.offsetTop < dropdown.scrollTop) {
          dropdown.scrollTop = previousActiveElement.offsetTop;
        }
        fetchSingleUser(previousActiveElement.getAttribute('data-login'));
        break;
      // If enter pressed, fill input with user login
      case 13:
        e.preventDefault(); // Don't send form data on "Enter"
        const result = activeLi.getAttribute('data-login');
        const url = activeLi.getAttribute('data-url');
        updateInputField(result, url, searchContainer);
        hideUserInfo();
        hideDropdown();
        input.blur();
        break;
      // by default update input and fetch users from github
      default:
        const search = input.value;
        searchContainer.setAttribute('action', 'https://www.github.com/' + search);
        hideUserInfo();
        // Set timeout to let user type more characters instead of fetching on every keyup
        clearTimeout(timer);
        timer = setTimeout(() => fetchUsers(search), 300);
    }
    
  })

  const showDropdown = () => {
    const dropdown = document.getElementsByClassName('dropdown')[0];
    if (dropdown) {
      dropdown.classList.remove('hidden');
      fetchSingleUser(document.querySelector('.active').getAttribute('data-login'));
    }
  }

  // If input field gets focus, show dropdown
  input.addEventListener('focus', showDropdown);

  const hideDropdown = () => {
    const dropdown = document.getElementsByClassName('dropdown')[0];
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      if (dropdown) {
        dropdown.classList.add('hidden');
      }
      hideUserInfo();
    }, 100);
  }

  // If input field loses focus, hide dropdown
  input.addEventListener('blur', hideDropdown);

  const removeActiveClass = () => {
    const activeElement = document.querySelector('.active')
    if (activeElement) {
      activeElement.classList.remove('active');
    }  
  }

  const toggleActiveClass = (element) => {
    removeActiveClass();
    element.classList.add('active');
  }

  const capitalize = function(str) {
    return [str.charAt(0).toUpperCase(), str.substring(1)].join("");
  };

  // Set input value and form action
  const updateInputField = (value, url, form) => {
    input.value = value;
    form.setAttribute('action', url);
  }
})();