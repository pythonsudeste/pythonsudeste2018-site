document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("certs-verify").addEventListener("click", function(){
    var code = getCode();

    if(code.length !== 19){
      showResult([
        "ERRO!", "",
        "Código com tamanho inválido!", "",
        "Os códigos são da forma XXXX-XXXX-XXXX-XXXX."
      ].join("<br>"), "#ffaaaa");
      return;
    };

    var categoryElement = document.getElementById("certs-category");
    var category = categoryElement.value;
    var name = getName();
    var msg = buildMessage(category, code, name);
    var hash = sha3_224(msg);

    if(!hashes.includes(hash)){
      showResult([
        "Oops!", "",
        [
          "<ul>",
            "<li>Ou esse certificado é inválido;",
            "<li>Ou há algum campo que não foi preenchido corretamente.",
          "</ul>"
        ].join(""),
      ].join("<br>"), "#ffaaaa");
    } else
      showResult([
        "Certificado válido!", "",
        [
          "<ul>",
            "<li>Nome: ", capitalizeName(name),
            "<li>Código: ", code,
            "<li>Categoria: ", categoryElement.selectedOptions[0].textContent,
          "</ul>"
        ].join(""),
      ].join("<br>"), "#aaffaa");
  });
});

function lowerNormalize(name){
  return name.normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "")
             .replace(/\s+/g, " ")
             .trim()
             .toLowerCase();
};

function getName(){
  return lowerNormalize(document.getElementById("certs-name").value);
};

function capitalizeName(name){
  return name.split(" ")
             .map(function(ch){
                    return ["da", "de", "do", "dos", "von"].includes(ch)
                           ? ch
                           : ch.charAt(0).toUpperCase() + ch.slice(1);
                  })
             .join(" ");
};

function getCode(){
  return document.getElementById("certs-code")
                 .value
                 .replace(/\s|-/g, "")
                 .replace(/(....)(....)(....)(....)/g, "$1-$2-$3-$4");
};

function buildMessage(category, code, name){
  return `2018/Python-${category}_${code}_${name}-Sudeste`;
};

function showResult(data, color){
  var node = document.getElementById("certs-result");
  node.innerHTML = data;
  node.style.color = color;
};
