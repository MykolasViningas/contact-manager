// Model - View - Controller

class Model {
  constructor() {}

  makeRequest(url, init) {
    return fetch(url, init);
  }

  getAllContacts() {
    return this.makeRequest('/api/contacts').then(data => {
      return data.json();
    }).catch(error => {
      console.log(error);
    });
  }

  addContact(data) {
    data = this.formDataToObj(data);

    return this.makeRequest('/api/contacts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    }).then(newContact => {
      return newContact.json();
    }).catch(error => {
      console.log(error);
    });
  }

  getContact(id, handler) {
    return this.makeRequest(`/api/contacts/${id}`).then(contact => {
      return contact.json();
    }).then(json => {
      handler(json);
    }).catch(error => {
      console.log(error);
    });
  }

  updateContact(id, data) {
    data = this.formDataToObj(data);

    return this.makeRequest(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    }).then(updatedContact => {
      return updatedContact.json();
    }).catch(error => {
      console.log(error);
    });
  }

  deleteContact(id, handler) {
    return this.makeRequest(`/api/contacts/${id}`, { method: 'delete' }).then(response => {
      if (!response.ok) {
        console.log("Unable to delete contact!");
      } else {
        console.log('Contact deleted!');
        handler();
      }
    }).catch(error => {
      console.log(error);
    });
  }

  formDataToObj(data) {
    let obj = {tags: []};

    for (let pair of data) {
      let key = pair[0];
      let value = pair[1];

      if (value) {
        if (key === 'tag') {
          obj.tags.push(value);
        } else {
          obj[key] = value;
        }
      }
    }

    obj.tags = obj.tags.join(',');
    return obj;
  }

  filterUniqueTags(data) {
    let tags = [];
    data.forEach(contact => {
      contact.tags.split(',').forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    });

    return tags;
  }

  makeFormSubmit(method, url, data, handler) {
    if (method === 'PUT') {
      let id = url.slice(-1);
      data.set('id', id);
    }

    data = this.formDataToObj(data);

    this.makeRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    }).then(response => {
      return response.json();
    }).then(json => {
      handler(json);
    }).catch(error => {
      console.log(error);
    });
  }
}

class View {
  constructor() {
    this.secondRow = document.querySelector('#second_row');
    this.thirdRow = document.querySelector('#third_row');
    this.createTagForm = document.querySelector('#create_tag');
    this.tags = document.querySelector('#tags');
    this.search = document.querySelector('#search');
    this.contactFormContainer = document.querySelector('#form_container');
    this.contactForm = this.contactFormContainer.querySelector('form');

    this.contactListTemplate = Handlebars.compile(document.querySelector('#contacts').innerHTML);
    this.contactTemplate = Handlebars.compile(document.querySelector('#contact').innerHTML);
    Handlebars.registerPartial('contact', document.querySelector('#contact').innerHTML);
  }

  showForm() {
    this.contactFormContainer.style.display = 'block';
    this.secondRow.style.display = 'none';
  }

  showContacts() {
    this.contactFormContainer.style.display = 'none';
    this.secondRow.style.display = 'block';
  }

  addTag() {
    let input = this.createTagForm.firstElementChild;

    let tag = document.createElement('a');
    let value = input.value.trim();

    if (value.length === 0) return;

    tag.innerHTML = `<p>${value}</p><span>x</span>`;
    this.tags.appendChild(tag);
    this.createTagForm.reset();
  }

  selectOrRemoveTag(tagChild) {
    let tag = tagChild.parentElement;

    if (tagChild.tagName === 'SPAN') {
      tag.remove();
    } else if (tagChild.tagName === 'P') {
      tag.classList.toggle('selected');
      this.showContactsOfSelectedTags()
    }
  }

  addTagsToForm(checked = []) {
    let dd = this.contactFormContainer.querySelector('dl dd:last-of-type');
    dd.innerHTML = '';
    [...document.querySelectorAll('#tags a p')].forEach(p => {
      let tag = p.textContent;

      let label = document.createElement('label');
      label.textContent = tag + ' ';
      let input = document.createElement('input');
      input.type = 'checkbox';
      input.id = tag;
      input.name = 'tag';
      input.value = tag;

      if (checked.includes(tag)) {
        input.checked = true;
      }
      
      label.appendChild(input);
      dd.appendChild(label);
    });
  }

  showContactsOfSelectedTags() {
    let selectedTags = [...document.querySelectorAll('#tags a.selected p')].map(p => p.textContent);
    let contacts = document.querySelector('#contact_list');

    contacts = contacts ? [...contacts.children] : [];

    if (selectedTags.length === 0) {
      contacts.forEach(li => li.style.display = 'inline-block');
      this.thirdRow.style.display = 'none';
      return;
    }

    this.showContactsByTags(contacts, selectedTags);
    
    if (contacts.length === 0 || contacts.every(contact => contact.style.display === 'none')) {
      this.thirdRow.style.display = 'block';
      this.thirdRow.textContent = `There are no contacts with tag${selectedTags.length > 1 ? 's' : ''} "${selectedTags.join(', ')}".`;
    } else {
      this.thirdRow.style.display = 'none';
    }
  }

  showContactsByTags(contacts, tags) {
    contacts.forEach(li => {
      let contactTags = li.querySelector('.tags').textContent.split(',');

      for (let i = 0; i < tags.length; i++) {
        let tag = tags[i];

        if (contactTags.includes(tag)) {
          li.style.display = 'inline-block';
        } else {
          li.style.display = 'none';
          return;
        }
      }
    });
  }

  markInvalidInput(field) {
    let input = this.contactForm[field];

    input.classList.add('invalid');
    input.nextElementSibling.style.display = 'block';
    this.contactForm.querySelector(`label[for=${field}]`).classList.add('invalid');
  }

  markValidInput(field) {
    let input = this.contactForm[field];

    input.classList.toggle('invalid', false);
    input.nextElementSibling.style.display = 'none';
    this.contactForm.querySelector(`label[for=${field}]`).classList.toggle('invalid', false);
  }

  markFields() {
    ['full_name', 'email', 'phone_number'].forEach(field => {
      if (this.contactForm[field].value.trim() === '') {
        this.markInvalidInput(field);
      } else {
        this.markValidInput(field);
      }
    });
  }

  addToTags(tag) {
    this.tags.insertAdjacentHTML('beforeend', `<a><p>${tag}</p><span>x</span></a>`);
  }

  resetForm() {
    this.contactFormContainer.querySelector('h2').textContent = 'Create Contact';
    this.contactForm.action = '/api/contacts/';
    this.contactForm.method = 'POST';
    this.contactForm.className = 'create';
    ['full_name', 'email', 'phone_number'].forEach(field => this.markValidInput(field));
    this.contactForm.reset();
  }

  renderContent(contacts, tags) {
    if (contacts.length > 0) this.secondRow.classList.add('contacts');
    tags.forEach(tag => tag && this.addToTags(tag));

    this.secondRow.innerHTML = this.contactListTemplate({contacts: contacts});
    this.secondRow.style.display = 'block';
  }

  updateContact(data) {
    let newHTML = this.contactTemplate(data);
    let li = document.querySelector(`li[id='${data.id}']`);
    li.outerHTML = newHTML;

    this.showContacts();
    this.resetForm();
  }

  removeContact(id) {
    let li = document.querySelector(`li[id="${id}"]`);

    if (li.parentElement.children.length <= 1) {
      this.secondRow.classList.remove('contacts');
      this.secondRow.innerHTML = this.contactListTemplate({data: []});
    }

    li.remove();
  }

  addContact(data) {
    let liHTML = this.contactTemplate(data);

    let contactList = document.querySelector('#contact_list');
    if (contactList) {
      contactList.insertAdjacentHTML('beforeend', liHTML);
    } else {
      this.secondRow.innerHTML = this.contactListTemplate({contacts: [data]});
      this.secondRow.classList.add('contacts');
    }

    this.showContacts();
    this.resetForm();
  }

  renderEditForm(data) {
    this.showForm();

    this.contactFormContainer.querySelector('h2').textContent = 'Edit Contact';
    this.contactForm['full_name'].value = data.full_name;
    this.contactForm['phone_number'].value = data.phone_number;
    this.contactForm['email'].value = data.email;
    
    let checkedTags = data.tags ? data.tags.split(',') : [];
    this.addTagsToForm(checkedTags);

    this.contactForm.classList.replace('create', 'edit');
    this.contactForm.method = 'PUT';
    this.contactForm.action += data.id;
  }

  invalidFormInputs() {
    return this.contactForm.querySelector('.invalid');
  }

  showSearchResults() {
    let value = this.search.value.trim();
    let contacts = document.querySelectorAll('#contact_list li');

    if (!contacts) {
      this.thirdRow.style.display = 'block';
      this.thirdRow.textContent = `There are no contacts that include "${value}".`;
      return;
    }
    
    contacts = [...contacts];

    if (value === '') {
      contacts.forEach(contact => contact.style.display = 'inline-block');
      this.thirdRow.style.display = 'none';
      return;
    }

    contacts.forEach(li => {
      let contactName = li.querySelector('.name').textContent.toLowerCase();

      if (contactName.indexOf(value.toLowerCase()) !== -1) {
        li.style.display = 'inline-block';
      } else {
        li.style.display = 'none';
      }
    });

    if (contacts.length === 0 || contacts.every(contact => contact.style.display === 'none')) {
      this.thirdRow.style.display = 'block';
      this.thirdRow.textContent = `There are no contacts that include "${value}".`;
    } else {
      this.thirdRow.style.display = 'none';
    }
  }

  bindContactFormSubmit(handler) {
    this.contactForm.addEventListener('submit', event => {
      event.preventDefault();

      let method = this.contactForm.getAttribute('method');
      let url = this.contactForm.getAttribute('action');
      let formData = new FormData(this.contactForm);

      handler(method, url, formData);
    });
  }

  bindAddTag(handler) {
    this.createTagForm.addEventListener('submit', event => {
      event.preventDefault();

      handler();
    });
  }

  bindSearch(handler) {
    this.search.addEventListener('input', event => {
      event.preventDefault();

      handler();
    });
  }

  bindClick(addContactHandler, cancelClickHandler, deleteContactHandler, editContactHandler, tagClickHandler) {
    document.addEventListener('click', event => {
      let element = event.target;

      if (element.tagName === 'A') event.preventDefault();

      if (element.classList.contains('add_contact')) {
        addContactHandler();
      } else if (element.id === 'cancel') {
        cancelClickHandler();
      } else if (element.id === 'delete') {
        let id = element.closest('li').getAttribute('id');
        deleteContactHandler(id);
      } else if (element.id === 'edit') {
        let id = element.closest('li').getAttribute('id');
        editContactHandler(id);
      } else if (element.parentElement.tagName === 'A') {
        tagClickHandler(element);
      }
    });
  }
}

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.view.bindContactFormSubmit(this.handleContactFormSubmit.bind(this));
    this.view.bindAddTag(this.handleAddTag.bind(this));
    this.view.bindSearch(this.handleSearch.bind(this));
    this.view.bindClick(this.handleAddContact.bind(this), this.handleCancelClick.bind(this),
                        this.handleDeleteContact.bind(this), this.handleEditContact.bind(this),
                        this.handleTagClick.bind(this));

    this.renderPage();
  }

  async renderPage() {
    let contacts = await this.model.getAllContacts();
    let tags = this.model.filterUniqueTags(contacts);
    this.view.renderContent(contacts, tags);
  }

  handleAddContact() {
    this.view.showForm();
    this.view.addTagsToForm();
  }

  handleCancelClick() {
    this.view.resetForm();
    this.view.showContacts();
  }

  handleAddTag() {
    this.view.addTag();
  }

  handleTagClick(tagChild) {
    this.view.selectOrRemoveTag(tagChild);
  }

  handleContactFormSubmit(method, url, formData) {
    if (method === 'POST') {
      this.view.markFields();
      if (this.view.invalidFormInputs()) return;

      this.model.makeFormSubmit('POST', url, formData, data => {
        this.view.addContact(data);
      });
    } else if (method === 'PUT') {
      this.model.makeFormSubmit('PUT', url, formData, data => {
        this.view.updateContact(data);
      });
    }
  }

  handleDeleteContact(id) {
    let response = confirm('Do you want to delete the contact?');
    if (!response) return;

    this.model.deleteContact(id, () => {
      this.view.removeContact(id);
    });
  }

  handleEditContact(id) {
    this.model.getContact(id, data => {
      this.view.renderEditForm(data);
    });
  }

  handleSearch() {
    this.view.showSearchResults();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new Controller(new Model(), new View());
});



// Old App

// const App = {
//   addTagsToForm(checked = []) {
//     let dd = this.contactFormContainer.querySelector('dl dd:last-of-type');
//     dd.innerHTML = '';
//     [...document.querySelectorAll('#tags a p')].forEach(p => {
//       let tag = p.textContent;

//       let label = document.createElement('label');
//       label.textContent = tag + ' ';
//       let input = document.createElement('input');
//       input.type = 'checkbox';
//       input.id = tag;
//       input.name = 'tag';
//       input.value = tag;

//       if (checked.includes(tag)) {
//         input.checked = true;
//       }
      
//       label.appendChild(input);
//       dd.appendChild(label);
//     });
//   },

//   handleAddContact(event) {
//     event.preventDefault();

//     this.contactFormContainer.style.display = 'block';
//     this.secondRow.style.display = 'none';
//     this.addTagsToForm();

//     this.contactFormContainer.classList.add('slide_up');
//   },

//   handleCancelClick(event) {
//     event.preventDefault();
//     this.contactFormContainer.style.display = 'none';
//     this.resetForm();
//     this.secondRow.style.display = 'block';

//     this.contactFormContainer.classList.remove('slide_up');
//   },

//   handleAddTag(event) {
//     event.preventDefault();

//     let input = this.createTagForm.firstElementChild;

//     let tag = document.createElement('a');
//     let value = input.value.trim();

//     if (value.length === 0) return;

//     tag.innerHTML = `<p>${value}</p><span>x</span>`;

//     document.querySelector('#tags').appendChild(tag);
//     this.createTagForm.reset();
//   },

//   showContactsByTags(contacts, tags) {
//     [...contacts.children].forEach(li => {
//       let contactTags = li.querySelector('.tags').textContent.split(',');

//       for (let i = 0; i < tags.length; i++) {
//         let tag = tags[i];

//         if (contactTags.includes(tag)) {
//           li.style.display = 'inline-block';
//         } else {
//           li.style.display = 'none';
//           return;
//         }
//       }
//     });
//   },

//   handleTagClick(event) {
//     event.preventDefault();

//     let target = event.target;
//     let parent = target.parentElement;
//     let contactList = document.querySelector('#contact_list');

//     if (target.tagName === 'SPAN') {
//       parent.remove();
//     } else if (target.tagName === 'P') {
//       parent.classList.toggle('selected');

//       let selectedTags = [...document.querySelectorAll('#tags a.selected p')].map(p => p.textContent);
      
//       if (selectedTags.length === 0) {
//         [...contactList.children].forEach(li => li.style.display = 'inline-block');
//         this.thirdRow.style.display = 'none';
//         return;
//       }

//       this.showContactsByTags(contactList, selectedTags);
      
//       if (contactList.children.length === 0 ||
//           [...contactList.children].every(contact => contact.style.display === 'none')) {
//         this.thirdRow.style.display = 'block';
//         this.thirdRow.textContent = `There are no contacts with tag${selectedTags.length > 1 ? 's' : ''} "${selectedTags.join(', ')}".`;
//       } else {
//         this.thirdRow.style.display = 'none';
//       }
//     }
//   },

//   formDataToJSON(data) {
//     let json = {tags: []};

//     for (let pair of data) {
//       let key = pair[0];
//       let value = pair[1];

//       if (value) {
//         if (key === 'tag') {
//           json.tags.push(value);
//         } else {
//           json[key] = value;
//         }
//       }
//     }

//     json.tags = json.tags.join(',');
//     return JSON.stringify(json);
//   },

//   markInvalid(field) {
//     let input = this.contactForm[field];

//     input.classList.add('invalid');
//     input.nextElementSibling.style.display = 'block';
//     this.contactForm.querySelector(`label[for=${field}]`).classList.add('invalid');
//   },

//   markValid(field) {
//     let input = this.contactForm[field];

//     input.classList.toggle('invalid', false);
//     input.nextElementSibling.style.display = 'none';
//     this.contactForm.querySelector(`label[for=${field}]`).classList.toggle('invalid', false);
//   },

//   markFields(data) {
//     for (let pair of data) {
//       let key = pair[0];
//       let value = pair[1];

//       if (key !== 'tag') {
//         if (!value) {
//           this.markInvalid(key);
//         } else {
//           this.markValid(key);
//         }
//       }
//     }
//   },

//   handlePUTFormSubmit(url, data) {
//     let id = url.slice(-1);
//     data.set('id', id);

//     let json = this.formDataToJSON(data);

//     let request = new XMLHttpRequest();
//     request.open('PUT', url);
//     request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

//     request.addEventListener('load', event => {
//       let data = JSON.parse(request.response);
//       let liHTML = this.contactTemplate(data);

//       let li = document.querySelector(`li[id='${id}']`);
//       li.outerHTML = liHTML;

//       this.secondRow.style.display = 'block';
//       this.contactFormContainer.style.display = 'none';
//       this.resetForm();
//     });

//     request.send(json);
//   },

//   handlePOSTFormSubmit(url, data) {
//     this.markFields(data);

//     if (this.contactForm.querySelector('.invalid')) return;

//     let json = this.formDataToJSON(data);

//     let request = new XMLHttpRequest();
//     request.open('POST', url);
//     request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

//     request.addEventListener('load', event => {
//       let data = JSON.parse(request.response);
//       let liHTML = this.contactTemplate(data);

//       let contactList = document.querySelector('#contact_list');
//       if (contactList) {
//         contactList.insertAdjacentHTML('beforeend', liHTML);
//       } else {
//         this.secondRow.innerHTML = this.contactListTemplate({contacts: [data]});
//         this.secondRow.classList.add('contacts');
//       }

//       this.secondRow.style.display = 'block';
//       this.contactFormContainer.style.display = 'none';
//       this.resetForm();
//     });

//     request.send(json);
//   },

//   handleContactFormSubmit(event) {
//     event.preventDefault();

//     let method = this.contactForm.getAttribute('method');
//     let url = this.contactForm.getAttribute('action');
//     let formData = new FormData(this.contactForm);

//     if (method === 'POST') {
//       this.handlePOSTFormSubmit(url, formData)
//     } else if (method === 'PUT') {
//       this.handlePUTFormSubmit(url, formData, (data) => {
//         let liHTML = this.contactTemplate(data);
  
//         let li = document.querySelector(`li[id='${id}']`);
//         li.outerHTML = liHTML;
  
//         this.secondRow.style.display = 'block';
//         this.contactFormContainer.style.display = 'none';
//         this.resetForm();
//       });
//     }
//   },

//   addToTags(tag) {
//     this.createTagForm.firstElementChild.value = tag;
//     this.createTagForm.dispatchEvent(new Event('submit'));
//   },

//   filterUniqueTags(data) {
//     let tags = [];
//     data.forEach(contact => {
//       contact.tags.split(',').forEach(tag => {
//         if (!tags.includes(tag)) {
//           tags.push(tag);
//         }
//       });
//     });

//     return tags;
//   },

//   renderContent() {
//     let request = new XMLHttpRequest();
//     request.open('GET', this.url);

//     request.addEventListener('load', event => {
//       let data = JSON.parse(request.response);
//       if (data.length > 0) this.secondRow.classList.add('contacts');

//       let tags = this.filterUniqueTags(data);
//       tags.forEach(tag => this.addToTags(tag));

//       this.secondRow.innerHTML = this.contactListTemplate({contacts: data});
//       this.secondRow.style.display = 'block';
//     });

//     request.send();
//   },

//   handleDelete(event) {
//     event.preventDefault();

//     let response = confirm('Do you want to delete the contact?');
//     if (!response) return;

//     let li = event.target.closest('li');

//     let request = new XMLHttpRequest();
//     request.open('DELETE', `${this.url}/${li.getAttribute('id')}`);

//     request.addEventListener('load', event => {
//       if (li.parentElement.children.length <= 1) {
//         this.secondRow.classList.remove('contacts');
//         this.secondRow.innerHTML = this.contactListTemplate({data: []});
//       }

//       li.remove();
//     });

//     request.send();
//   },

//   handleEdit(event) {
//     event.preventDefault();

//     this.contactFormContainer.style.display = 'block';
//     this.secondRow.style.display = 'none';

//     this.contactFormContainer.querySelector('h2').textContent = 'Edit Contact';
//     let li = event.target.closest('li');
//     this.contactForm['full_name'].value = li.querySelector('.name').textContent;
//     this.contactForm['phone_number'].value = li.querySelector('.phone').textContent;
//     this.contactForm['email'].value = li.querySelector('.email').textContent;
    
//     let checkedTags = li.querySelector('.tags').textContent.split(',');
//     this.addTagsToForm(checkedTags);

//     this.contactForm.classList.replace('create', 'edit');
//     this.contactForm.method = 'PUT';
//     this.contactForm.action = `${this.url}/${li.id}`;

//     this.contactFormContainer.classList.add('slide_up');
//   },

//   resetForm() {
//     this.contactFormContainer.querySelector('h2').textContent = 'Create Contact';
//     this.contactForm.action = this.url;
//     this.contactForm.method = 'POST';
//     this.contactForm.className = 'create';
//     ['full_name', 'email', 'phone_number'].forEach(this.markValid.bind(this));
//     this.contactForm.reset();
//   },

//   handleSearch(event) {
//     event.preventDefault();

//     let value = event.target.value.trim();
//     let contacts = document.querySelectorAll('#contact_list li');

//     if (!contacts) {
//       this.thirdRow.style.display = 'block';
//       this.thirdRow.textContent = `There are no contacts starting with "${value}".`;
//       return;
//     }
    
//     contacts = [...contacts];

//     if (value === '') {
//       contacts.forEach(contact => contact.style.display = 'inline-block');
//       this.thirdRow.style.display = 'none';
//       return;
//     }

//     contacts.forEach(li => {
//       let contactName = li.querySelector('.name').textContent.toLowerCase();

//       if (contactName.indexOf(value.toLowerCase()) !== -1) {
//         li.style.display = 'inline-block';
//       } else {
//         li.style.display = 'none';
//       }
//     });

//     if (contacts.length === 0 || contacts.every(contact => contact.style.display === 'none')) {
//       this.thirdRow.style.display = 'block';
//       this.thirdRow.textContent = `There are no contacts starting with "${value}".`;
//     } else {
//       this.thirdRow.style.display = 'none';
//     }
//   },

//   bindEvents() {
//     document.addEventListener('click', event => {
//       let element = event.target;

//       if (element.classList.contains('add_contact')) {
//         this.handleAddContact(event);
//       } else if (element.id === 'cancel') {
//         this.handleCancelClick(event);
//       } else if (element.id === 'delete') {
//         this.handleDelete(event);
//       } else if (element.id === 'edit') {
//         this.handleEdit(event);
//       } else if (element.parentElement.tagName === 'A') {
//         this.handleTagClick(event);
//       }
//     });

//     this.search.addEventListener('input', this.handleSearch.bind(this));
//     this.createTagForm.addEventListener('submit', this.handleAddTag.bind(this));
//     this.contactForm.addEventListener('submit', this.handleContactFormSubmit.bind(this));
//   },

//   init() {
//     this.url = '/api/contacts';
//     this.secondRow = document.querySelector('#second_row');
//     this.thirdRow = document.querySelector('#third_row');
//     this.contactFormContainer = document.querySelector('#form_container');
//     this.contactForm = this.contactFormContainer.querySelector('form');
//     this.createTagForm = document.querySelector('#create_tag');
//     this.search = document.querySelector('#search');

//     this.contactListTemplate = Handlebars.compile(document.querySelector('#contacts').innerHTML);
//     this.contactTemplate = Handlebars.compile(document.querySelector('#contact').innerHTML);
//     Handlebars.registerPartial('contact', document.querySelector('#contact').innerHTML);
    
//     this.renderContent();
//     this.bindEvents();
//   },
// };

// document.addEventListener('DOMContentLoaded', () => App.init());
