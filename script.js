function openPDF(src) {
    document.getElementById("pdfFrame").src = src;
    document.getElementById("pdfModal").style.display = "flex";
}

function closePDF() {
    document.getElementById("pdfFrame").src = "";
    document.getElementById("pdfModal").style.display = "none";
}
