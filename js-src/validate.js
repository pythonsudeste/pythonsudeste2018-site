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
    } else {

      var duration = getDuration(category, code, name);
      var categoryText = categoryElement.selectedOptions[0].textContent;

      var textArray = [
        "<ul>",
          "<li>Nome: ", capitalizeName(name),
          "<li>Código: ", code,
          "<li>Categoria: ", categoryText,
          "<li>Duração: ", duration
      ];

      if(!["O", "C"].includes(category.charAt(0))){
        var ptkEntry = getPTKEntry(category, code, name, duration);
        textArray.push(
          "<li>Título d", category.charAt(0) === "T" ? "o " : "a ",
                          categoryText.split(" ")[2],
                          ": ",
          ptkEntry.title
        );

        if(ptkEntry.speakers){
          textArray.push("<li>Atividade realizada em conjunto com: ");
          var extraSpeakers = [];
          var rawSpeakers = ptkEntry.speakers.split(",");
          for(var rsIdx = 0; rsIdx < rawSpeakers.length; rsIdx++){
            var rawSpeaker = rawSpeakers[rsIdx].trim();
            var speaker = nameObject(rawSpeaker);
            if((speaker.first !== ptkEntry.first) ||
               (speaker.surname !== ptkEntry.surname))
              extraSpeakers.push(rawSpeaker);
          };
          textArray.push(extraSpeakers.length === 1 ? extraSpeakers[0] :
            [extraSpeakers.slice(0, -1).join(", "),
             extraSpeakers.slice(-1)[0]].join(" e "));
        };
      };

      textArray.push("</ul>");

      showResult([
        "Certificado válido!", "",
        textArray.join(""),
      ].join("<br>"), "#aaffaa");
    };
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

function nameObject(name){
  var nameArray = capitalizeName(
                  lowerNormalize(name)
                  .replace(/[^A-Za-z ]/g, "")
                ).split(" ");
  return {
    first: nameArray[0],
    surname: nameArray.slice(1).join(" ")
  };
};

function getCode(){
  return document.getElementById("certs-code")
                 .value
                 .replace(/\s|-/g, "")
                 .replace(/(....)(....)(....)(....)/g, "$1-$2-$3-$4");
};

function buildMessage(category, code, name){
  return ["2018/Python-", category, "_", code, "_", name, "-Sudeste"].join("");
};

function showResult(data, color){
  var node = document.getElementById("certs-result");
  node.innerHTML = data;
  node.style.color = color;
};

function getDuration(category, code, name){
  switch(category){
    case "ORG":
    case "ORGCORE":
    case "COMUM": return "22 horas";
    case "PALESTRA": return "45 minutos";
    case "KEYNOTE": return "1 hora";
    default: // Tutorial
      if(name.toLowerCase().charAt(0) === "d") return "6 horas e 50 minutos";
      switch(name.length){
        case 13: return "3 horas e 20 minutos";
        case 14: return "6 horas";
        case 15:
        case 22: return "4 horas";
        default: // Ambiguity!
          var s = sha3_224("TUTORIAL-" + code);
          if(s.charAt(3) < s.charAt(11)) return "2 horas e 20 minutos";
          return "3 horas";
      };
  };
};

function getPTKEntry(category, code, name, duration){
  var choices = [];
  var ptkEntries = titlesPTK[category];
  for(var ptkEntryIdx = 0; ptkEntryIdx < ptkEntries.length; ptkEntryIdx++){
    var ptkEntry = ptkEntries[ptkEntryIdx];
    var choice = nameObject(ptkEntry.name);
    choice.title = ptkEntry.title;
    if(category === "TUTORIAL") choice.duration = ptkEntry.duration;
    choice.speakers = ptkEntry.speakers;
    choices.push(choice);
  };

  var options = {scorer: customFuzzScorer};
  var query = nameObject(name);
  if(category === "TUTORIAL") query.duration = duration;
  var results = fuzzball.extract(query, choices, options);

  if(results[1][1] > 99){ // Ambiguity!
    var s = sha3_224(code + "-PALESTRA");
    if((results[1][0].title.length > results[0][0].title.length) !==
       (s.charAt(3) < s.charAt(11)))
      return results[1][0];
  };

  return results[0][0];
};

function customFuzzScorer(query, choice, options){
  if(query.duration !== choice.duration) return 0;
  return .8 * fuzzball.ratio(query.first, choice.first, options)
       + .2 * fuzzball.token_set_ratio(query.surname, choice.surname, options);
};
