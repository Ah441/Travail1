//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let selectedCategory;
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });

    $('#DDMenu').on("click", '#aboutCmd', function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de Bookmark</h2>
                <hr>
                <p>
                    Petite application de gestion de Bookmark à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Ahmad Ghosn
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}async function renderBookmarks(selectedCategory = "") {

    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let categories = [];
    let bookmarks = await API_GetBookmarks();
    eraseContent();
    
    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            if (
                !categories.includes(bookmark.Categorie) &&
                bookmark.Categorie != null
              ) {
                categories.push(bookmark.Categorie);
              }
              
            if (selectedCategory === "" || bookmark.Categorie === selectedCategory) {
                $("#content").append(renderBookmark(bookmark)); 
            }
        });
        
        restoreContentScrollPosition();
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        $(".bookmarkRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
    renderCategoryList(categories);
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateBookmarkForm() {
    renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark= await API_GetBookmark(id);
    if (bookmark!== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Bookmark introuvable!");
}
async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark= await API_GetBookmark(id);
    eraseContent();
    if (bookmark!== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
                <div class="bookmarkContainer">
                    <div class="bookmarkLayout">                <div class="big-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.URL}'); display: inline-block; vertical-align: middle;"></div>

                        <div class="bookmarkTitre">${bookmark.Titre}</div>
                        <div class="bookmarkCategorie">${bookmark.Categorie}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteBookmark(bookmark.Id);
            if (result)
                renderBookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Bookmark introuvable!");
    }
}
function newBookmark() {
    bookmark= {};
    bookmark.Id = 0;
    bookmark.Titre = "";
    bookmark.URL = "";
    bookmark.Categorie = "";
    return bookmark;
}
function renderBookmarkForm(bookmark= null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>
            <img src="Bookmark_Logo.png" style="width:50px" alt="" title="Gestionnaire de bookmarks">
            <br><br>
            <label for="Titre" class="form-label" style="font-weight:bold">Titre </label>
            <input 
                class="form-control Alpha"
                name="Titre" 
                id="Titre" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un Titre"
                InvalidMessage="Le Titre comporte un caractère illégal" 
                value="${bookmark.Titre}"
            />
            <label for="URL" class="form-label">URL </label>
            <input
                class="form-control URL"
                name="URL"
                id="URL"
                placeholder="URL"
                required
                RequireMessage="Veuillez entrer votre URL" 
                InvalidMessage="Veuillez entrer un URL valide"
                value="${bookmark.URL}" 
            />
            <label for="Categorie" class="form-label">Categorie </label>
            <input 
                class="form-control Categorie"
                name="Categorie"
                id="Categorie"
                placeholder="Categorie"
                required
                RequireMessage="Veuillez entrer votre Categorie" 
                InvalidMessage="Veuillez entrer un Categorie valide"
                value="${bookmark.Categorie}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark= getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await API_SaveBookmark(bookmark, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function renderBookmark(bookmark) {
    return $(`
    <div class="bookmarkRow" bookmark_id="${bookmark.Id}">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">
                <div class="big-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.URL}'); display: inline-block; vertical-align: middle;"></div>
                <span class="bookmarkTitre" style="display: inline-block; vertical-align: middle;">${bookmark.Titre}</span>
                <span class="bookmarkCategorie">${bookmark.Categorie}</span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Titre}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Titre}"></span>
            </div>
        </div>
    </a>           
    `); 
}
function renderCategoryList(categories) {
    const $DDMenu = $("#DDMenu").empty();
    
    $DDMenu.append(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa fa-fw mx-2"></i> Toutes les catégories
        </div>
        <div class="dropdown-divider"></div>
    `);

    $("#allCatCmd").on("click", function () {
        selectedCategory = "";
        renderBookmarks();
    });

    categories.forEach((categorie) => {
        const isSelected = selectedCategory === categorie;
        const checkClass = isSelected ? "fa-check" : "fa-fw";
        
        const categoryElement = $(`
            <div class="dropdown-item menuItemLayout category">
                <i class="menuIcon fa ${checkClass} mx-2"></i> ${categorie}
            </div>
        `);

        categoryElement.on("click", function () {
            selectedCategory = isSelected ? "" : categorie; 
            renderBookmarks(selectedCategory);
        });

        $DDMenu.append(categoryElement);
    });

    $DDMenu.append(`
        <div class="dropdown-item menuItemLayout category" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `);
}


function renderCategory(categorie){
    return $(`<div class="dropdown-item menuItemLayout category" id="allCatCmd"><i class="menuIcon fa fa-fw mx-2"></i> ${categorie}</div>`);
}
