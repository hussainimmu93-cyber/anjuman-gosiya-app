"use strict";

var KEY = "ANJUMAN_GOSIYA_APP";

var members = [];
var receipts = [];


/* =========================
   BASIC
========================= */

function $(id) {
    return document.getElementById(id);
}

function today() {
    var d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function currentMonth() {
    var d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0");
}

function currentYear() {
    return new Date().getFullYear();
}

function money(value) {
    return "₹" +
        Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   STORAGE
========================= */

function saveData() {

    localStorage.setItem(
        KEY,
        JSON.stringify({
            members: members,
            receipts: receipts
        })
    );
}

function loadData() {

    try {

        var data =
            JSON.parse(
                localStorage.getItem(KEY)
            );

        if (data) {

            members =
                Array.isArray(data.members)
                    ? data.members
                    : [];

            receipts =
                Array.isArray(data.receipts)
                    ? data.receipts
                    : [];
        }

    } catch (e) {

        members = [];
        receipts = [];
    }
}


/* =========================
   PAGE
========================= */

function showPage(pageId, navId) {

    document
        .querySelectorAll(".page")
        .forEach(function(page) {

            page.classList.remove("active");

        });

    var page = $(pageId);

    if (page) {
        page.classList.add("active");
    }

    document
        .querySelectorAll("nav button")
        .forEach(function(button) {

            button.classList.remove("active");

        });

    var nav = $(navId);

    if (nav) {
        nav.classList.add("active");
    }
}


/* =========================
   MEMBER MODAL
========================= */

function openMemberModal() {

    $("memberName").value = "";
    $("memberMobile").value = "";

    $("memberModal").style.display = "flex";

    $("memberName").focus();
}

function closeMemberModal() {

    $("memberModal").style.display = "none";
}


/* =========================
   SAVE MEMBER
========================= */

function saveMember() {

    var name =
        $("memberName").value.trim();

    var mobile =
        $("memberMobile").value.trim();

    if (!name) {

        alert(
            "Please enter member name."
        );

        $("memberName").focus();

        return;
    }

    if (mobile) {

        var cleanMobile =
            mobile.replace(/\D/g, "");

        if (
            cleanMobile.length !== 10 ||
            !/^[6-9]/.test(cleanMobile)
        ) {

            alert(
                "⚠️ Please enter a valid 10-digit mobile number."
            );

            $("memberMobile").focus();

            return;
        }

        var duplicateMobile =
            members.some(function(member) {

                var existingMobile =
                    String(
                        member.mobile || ""
                    ).replace(/\D/g, "");

                return (
                    existingMobile ===
                    cleanMobile
                );

            });

        if (duplicateMobile) {

            alert(
                "⚠️ This mobile number is already registered.\n\n" +
                "Same mobile number cannot be used for another member."
            );

            $("memberMobile").focus();

            return;
        }

        mobile = cleanMobile;
    }

    var member = {

        id:
            Date.now().toString(),

        name:
            name,

        mobile:
            mobile,

        createdAt:
            today()
    };

    members.push(member);

    saveData();

    refreshAll();

    closeMemberModal();

    populateMemberDropdown();

    alert(
        "✅ Member added successfully."
    );
}


/* =========================
   MEMBER LIST
========================= */

function renderMembers() {

    var container =
        $("membersList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (members.length === 0) {

        container.innerHTML =
            "<p>No members added yet.</p>";

        return;
    }

    members.forEach(function(member) {

        var row =
            document.createElement("div");

        row.className =
            "memberRow";

        row.innerHTML =

            "<strong>" +
            escapeHTML(member.name) +
            "</strong>" +

            "<br>" +

            "<span class='small'>" +
            (
                member.mobile
                    ? escapeHTML(member.mobile)
                    : "No mobile"
            ) +
            "</span>" +

            "<br>" +

            "<button class='danger' " +
            "onclick=\"deleteMember('" +
            member.id +
            "')\">" +
            "Delete" +
            "</button>";

        container.appendChild(row);
    });
}

function deleteMember(id) {

    var hasReceipt =
        receipts.some(function(receipt) {

            return receipt.memberId === id;

        });

    if (hasReceipt) {

        alert(
            "⚠️ This member has receipts.\n\n" +
            "Member cannot be deleted."
        );

        return;
    }

    if (
        !confirm(
            "Delete this member?"
        )
    ) {
        return;
    }

    members =
        members.filter(function(member) {

            return member.id !== id;

        });

    saveData();

    refreshAll();

    populateMemberDropdown();
}


/* =========================
   RECEIPT NUMBER
========================= */

function getNextReceiptNo() {

    if (receipts.length === 0) {
        return "001";
    }

    var maxNo = 0;

    receipts.forEach(function(receipt) {

        var number =
            parseInt(
                receipt.receiptNo,
                10
            );

        if (
            !isNaN(number) &&
            number > maxNo
        ) {

            maxNo = number;
        }
    });

    return String(
        maxNo + 1
    ).padStart(3, "0");
}


/* =========================
   MEMBER DROPDOWN
========================= */

function populateMemberDropdown() {

    var select =
        $("receiptMember");

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select Member</option>';

    members.forEach(function(member) {

        var option =
            document.createElement("option");

        option.value =
            member.id;

        option.textContent =
            member.name +
            (
                member.mobile
                    ? " - " + member.mobile
                    : ""
            );

        select.appendChild(option);
    });
}


/* =========================
   RECEIPT FORM
========================= */

function prepareReceiptForm() {

    populateMemberDropdown();

    $("receiptNo").value =
        getNextReceiptNo();

    $("receiptDate").value =
        today();

    $("receiptMember").value =
        "";

    $("receiptAmount").value =
        "";

    $("receiptMonth").value =
        currentMonth();

    $("receiptMode").value =
        "Cash";

    $("receiptPreview").innerHTML =
        "";
}


/* =========================
   SAVE RECEIPT
========================= */

function saveReceipt() {

    var receiptNo =
        $("receiptNo").value.trim();

    var date =
        $("receiptDate").value;

    var memberId =
        $("receiptMember").value;

    var amount =
        Number(
            $("receiptAmount").value
        );

    var month =
        $("receiptMonth").value;

    var mode =
        $("receiptMode").value;


    if (!receiptNo) {

        alert(
            "Please enter Receipt No."
        );

        return;
    }

    if (!date) {

        alert(
            "Please select Date."
        );

        return;
    }

    if (!memberId) {

        alert(
            "Please select Member."
        );

        return;
    }

    if (
        !amount ||
        amount <= 0
    ) {

        alert(
            "Please enter valid Amount."
        );

        return;
    }

    if (!month) {

        alert(
            "Please select Month."
        );

        return;
    }


    /* NORMAL RECEIPT:
       Duplicate Receipt No. NOT ALLOWED */

    var duplicateNo =
        receipts.some(function(receipt) {

            return (
                String(
                    receipt.receiptNo
                ).trim() === receiptNo
            );

        });

    if (duplicateNo) {

        alert(
            "⚠️ This Receipt No. already exists.\n\n" +
            "Please use another Receipt No."
        );

        return;
    }


    var receipt = {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 8),

        receiptNo:
            receiptNo,

        date:
            date,

        memberId:
            memberId,

        amount:
            amount,

        month:
            month,

        mode:
            mode,

        signature:
            "Aadilshah Hussain"
    };

    receipts.push(receipt);

    saveData();

    refreshAll();

    renderReceiptPreview(
        receipt.id
    );

    alert(
        "✅ Receipt saved successfully."
    );
}


/* =========================
   GET MEMBER
========================= */

function getMemberById(id) {

    return members.find(
        function(member) {

            return member.id === id;

        }
    );
}


/* =========================
   RECEIPT PREVIEW
========================= */

function renderReceiptPreview(id) {

    var receipt =
        receipts.find(
            function(r) {

                return r.id === id;

            }
        );

    if (!receipt) {
        return;
    }

    var member =
        getMemberById(
            receipt.memberId
        );

    if (!member) {
        return;
    }

    $("receiptPreview").innerHTML =

        '<div class="receipt" id="printReceipt">' +

            '<div class="arabic">' +
                'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ' +
            '</div>' +

            '<div class="receiptHeader">' +

                '<h2>' +
                    'अंजुमन गौसिया तालीमुल कुराण' +
                '</h2>' +

                '<div>' +
                    'PTR No.: 10418-95 (पुणे)' +
                '</div>' +

                '<div>' +
                    '42, कोरेगांव पार्क, गाडगे महाराज वस्ती, पुणे – 1' +
                '</div>' +

            '</div>' +

            '<div class="receiptTitle">' +
                'चंदा रसीद' +
            '</div>' +

            '<table class="receiptTable">' +

                '<tr>' +
                    '<td>Receipt No.</td>' +
                    '<td>' +
                        escapeHTML(
                            receipt.receiptNo
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Date</td>' +
                    '<td>' +
                        escapeHTML(
                            receipt.date
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Member Name</td>' +
                    '<td>' +
                        escapeHTML(
                            member.name
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Mobile</td>' +
                    '<td>' +
                        escapeHTML(
                            member.mobile || ""
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>For Month</td>' +
                    '<td>' +
                        escapeHTML(
                            receipt.month
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Payment Mode</td>' +
                    '<td>' +
                        escapeHTML(
                            receipt.mode
                        ) +
                    '</td>' +
                '</tr>' +

            '</table>' +

            '<div class="amountBox">' +
                money(receipt.amount) +
            '</div>' +

            '<div class="signature">' +

                '<div>' +
                    'Authorized Signature' +
                '</div>' +

                '<div class="signatureName">' +
                    'Aadilshah Hussain' +
                '</div>' +

            '</div>' +

        '</div>' +

        '<div class="actionButtons">' +

            '<button class="whatsapp" ' +
            'onclick="shareReceiptPDF(\'' +
            receipt.id +
            '\')">' +
            '📲 WhatsApp PDF' +
            '</button>' +

            '<button ' +
            'onclick="downloadReceiptPDF(\'' +
            receipt.id +
            '\')">' +
            '📥 Save PDF' +
            '</button>' +

        '</div>';
}


/* =========================
   DUPLICATE RECEIPT
   ONLY VIEW + RE-SHARE
========================= */

function openDuplicateModal() {

    populateDuplicateMembers();

    $("duplicateMonth").value =
        "";

    $("duplicateReceiptList").innerHTML =
        "";

    $("duplicateModal").style.display =
        "flex";
}

function closeDuplicateModal() {

    $("duplicateModal").style.display =
        "none";
}


/* =========================
   DUPLICATE MEMBER DROPDOWN
========================= */

function populateDuplicateMembers() {

    var select =
        $("duplicateMember");

    select.innerHTML =
        '<option value="">Select Member</option>';

    members.forEach(function(member) {

        var option =
            document.createElement("option");

        option.value =
            member.id;

        option.textContent =
            member.name +
            (
                member.mobile
                    ? " - " + member.mobile
                    : ""
            );

        select.appendChild(option);
    });
}


/* =========================
   FIND EXISTING RECEIPTS
========================= */

function showDuplicateReceipts() {

    var memberId =
        $("duplicateMember").value;

    var month =
        $("duplicateMonth").value;

    var list =
        $("duplicateReceiptList");

    list.innerHTML = "";

    if (!memberId || !month) {
        return;
    }

    var found =
        receipts.filter(
            function(receipt) {

                return (
                    receipt.memberId === memberId &&
                    receipt.month === month
                );

            }
        );

    if (found.length === 0) {

        list.innerHTML =
            "<p>No receipt found for this member/month.</p>";

        return;
    }


    found.forEach(function(receipt) {

        var box =
            document.createElement("div");

        box.className =
            "receiptRow";

        box.innerHTML =

            "<strong>" +
            "Receipt No. " +
            escapeHTML(
                receipt.receiptNo
            ) +
            "</strong>" +

            "<br>" +

            "<span class='small'>" +
            "Date: " +
            escapeHTML(
                receipt.date
            ) +
            " | Amount: " +
            money(
                receipt.amount
            ) +
            "</span>" +

            "<br><br>" +

            "<button onclick=\"viewDuplicateReceipt('" +
            receipt.id +
            "')\">" +
            "👁️ View Receipt" +
            "</button>" +

            "<button class='whatsapp' " +
            "onclick=\"shareDuplicateReceipt('" +
            receipt.id +
            "')\">" +
            "📲 Re-Share PDF" +
            "</button>";

        list.appendChild(box);
    });
}


/* =========================
   VIEW EXISTING RECEIPT
========================= */

function viewDuplicateReceipt(id) {

    var receipt =
        receipts.find(function(r) {

            return r.id === id;

        });

    if (!receipt) {

        alert(
            "❌ Receipt not found."
        );

        return;
    }

    closeDuplicateModal();

    showPage(
        "receiptPage",
        "navReceipt"
    );

    populateMemberDropdown();

    $("receiptNo").value =
        receipt.receiptNo;

    $("receiptDate").value =
        receipt.date;

    $("receiptMember").value =
        receipt.memberId;

    $("receiptAmount").value =
        receipt.amount;

    $("receiptMonth").value =
        receipt.month;

    $("receiptMode").value =
        receipt.mode;

    renderReceiptPreview(
        receipt.id
    );

    window.scrollTo(
        0,
        0
    );
}


/* =========================
   RE-SHARE EXISTING RECEIPT
========================= */

function shareDuplicateReceipt(id) {

    var receipt =
        receipts.find(function(r) {

            return r.id === id;

        });

    if (!receipt) {

        alert(
            "❌ Receipt not found."
        );

        return;
    }

    closeDuplicateModal();

    showPage(
        "receiptPage",
        "navReceipt"
    );

    populateMemberDropdown();

    $("receiptNo").value =
        receipt.receiptNo;

    $("receiptDate").value =
        receipt.date;

    $("receiptMember").value =
        receipt.memberId;

    $("receiptAmount").value =
        receipt.amount;

    $("receiptMonth").value =
        receipt.month;

    $("receiptMode").value =
        receipt.mode;

    renderReceiptPreview(
        receipt.id
    );

    setTimeout(
        function() {

            shareReceiptPDF(
                receipt.id
            );

        },
        500
    );
}


/* =========================
   PDF
========================= */

async function createReceiptPDF(id) {

    var element =
        document.getElementById(
            "printReceipt"
        );

    if (!element) {

        renderReceiptPreview(id);

        element =
            document.getElementById(
                "printReceipt"
            );
    }

    if (!element) {

        throw new Error(
            "Receipt preview not found."
        );
    }

    var canvas =
        await html2canvas(
            element,
            {
                scale: 2,
                useCORS: true
            }
        );

    var imageData =
        canvas.toDataURL(
            "image/png"
        );

    var jsPDF =
        window.jspdf.jsPDF;

    var pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    var pageWidth =
        pdf.internal.pageSize.getWidth();

    var pageHeight =
        pdf.internal.pageSize.getHeight();

    var margin = 10;

    var imageWidth =
        pageWidth -
        (margin * 2);

    var imageHeight =
        canvas.height *
        imageWidth /
        canvas.width;

    if (
        imageHeight >
        pageHeight -
        (margin * 2)
    ) {

        imageHeight =
            pageHeight -
            (margin * 2);
    }

    pdf.addImage(
        imageData,
        "PNG",
        margin,
        margin,
        imageWidth,
        imageHeight
    );

    return pdf;
}


/* =========================
   DOWNLOAD PDF
========================= */

async function downloadReceiptPDF(id) {

    try {

        var receipt =
            receipts.find(function(r) {

                return r.id === id;

            });

        if (!receipt) {

            alert(
                "Receipt not found."
            );

            return;
        }

        var pdf =
            await createReceiptPDF(
                id
            );

        pdf.save(
            "Receipt-" +
            receipt.receiptNo +
            ".pdf"
        );

    } catch (error) {

        console.error(error);

        alert(
            "❌ PDF create nahi ho saka."
        );
    }
}


/* =========================
   SHARE PDF
========================= */

async function shareReceiptPDF(id) {

    try {

        var receipt =
            receipts.find(function(r) {

                return r.id === id;

            });

        if (!receipt) {

            alert(
                "Receipt not found."
            );

            return;
        }

        var pdf =
            await createReceiptPDF(
                id
            );

        var blob =
            pdf.output("blob");

        var file =
            new File(
                [blob],
                "Receipt-" +
                receipt.receiptNo +
                ".pdf",
                {
                    type:
                        "application/pdf"
                }
            );

        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
                files: [file]
            })
        ) {

            await navigator.share({

                title:
                    "Chanda Receipt",

                text:
                    "अंजुमन गौसिया तालीमुल कुराण\n" +
                    "Receipt No.: " +
                    receipt.receiptNo,

                files:
                    [file]
            });

        } else {

            pdf.save(
                "Receipt-" +
                receipt.receiptNo +
                ".pdf"
            );

            alert(
                "📥 PDF save ho gaya.\n\n" +
                "Ab aap WhatsApp par attach karke bhej sakte hain."
            );
        }

    } catch (error) {

        console.error(error);

        if (
            error &&
            error.name === "AbortError"
        ) {
            return;
        }

        alert(
            "❌ PDF share nahi ho saka."
        );
    }
}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    $("totalMembers").textContent =
        members.length;

    $("totalReceipts").textContent =
        receipts.length;

    var total =
        receipts.reduce(
            function(sum, receipt) {

                return (
                    sum +
                    Number(
                        receipt.amount || 0
                    )
                );

            },
            0
        );

    $("totalCollection").textContent =
        money(total);

    var month =
        currentMonth();

    var monthTotal =
        receipts.reduce(
            function(sum, receipt) {

                if (
                    receipt.month === month
                ) {

                    return (
                        sum +
                        Number(
                            receipt.amount || 0
                        )
                    );
                }

                return sum;

            },
            0
        );

    $("thisMonthCollection").textContent =
        money(monthTotal);
}


/* =========================
   MONTHLY REPORT
========================= */

function showMonthlyReport() {

    var month =
        $("monthlyMonth").value;

    if (!month) {

        alert(
            "Please select month."
        );

        return;
    }

    var monthReceipts =
        receipts.filter(
            function(receipt) {

                return (
                    receipt.month === month
                );

            }
        );

    var total =
        monthReceipts.reduce(
            function(sum, receipt) {

                return (
                    sum +
                    Number(
                        receipt.amount || 0
                    )
                );

            },
            0
        );

    var html =

        "<h3>Monthly Report: " +
        escapeHTML(month) +
        "</h3>" +

        "<div class='totalBox'>" +
        "Total Collection: " +
        money(total) +
        "</div>";

    if (
        monthReceipts.length === 0
    ) {

        html +=
            "<p>No paid receipt found.</p>";

        $("monthlyReport").innerHTML =
            html;

        return;
    }

    html +=

        "<table class='reportTable'>" +

        "<tr>" +
        "<th>Receipt No.</th>" +
        "<th>Date</th>" +
        "<th>Member</th>" +
        "<th>Mobile</th>" +
        "<th>Month</th>" +
        "<th>Amount</th>" +
        "<th>Mode</th>" +
        "<th>Signature</th>" +
        "</tr>";

    monthReceipts.forEach(
        function(receipt) {

            var member =
                getMemberById(
                    receipt.memberId
                );

            html +=

                "<tr>" +

                "<td>" +
                escapeHTML(
                    receipt.receiptNo
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    receipt.date
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    member
                        ? member.name
                        : ""
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    member
                        ? member.mobile
                        : ""
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    receipt.month
                ) +
                "</td>" +

                "<td>" +
                money(
                    receipt.amount
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    receipt.mode
                ) +
                "</td>" +

                "<td>" +
                "Aadilshah Hussain" +
                "</td>" +

                "</tr>";
        }
    );

    html +=
        "</table>";

    $("monthlyReport").innerHTML =
        html;
}


/* =========================
   EXCEL
========================= */

function getExcelRows(list) {

    return list.map(
        function(receipt) {

            var member =
                getMemberById(
                    receipt.memberId
                );

            return {

                "Receipt No.":
                    receipt.receiptNo,

                "Date":
                    receipt.date,

                "Member Name":
                    member
                        ? member.name
                        : "",

                "Mobile":
                    member
                        ? member.mobile
                        : "",

                "For Month":
                    receipt.month,

                "Amount":
                    Number(
                        receipt.amount || 0
                    ),

                "Payment Mode":
                    receipt.mode,

                "Signature":
                    "Aadilshah Hussain"
            };
        }
    );
}


function exportMonthlyExcel() {

    var month =
        $("monthlyMonth").value;

    if (!month) {

        alert(
            "Please select month."
        );

        return;
    }

    var list =
        receipts.filter(
            function(receipt) {

                return (
                    receipt.month === month
                );

            }
        );

    var rows =
        getExcelRows(list);

    var worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );

    var workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Monthly"
    );

    XLSX.writeFile(
        workbook,
        "Monthly_Collection_" +
        month +
        ".xlsx"
    );
}


function exportYearlyExcel() {

    var year =
        Number(
            $("reportYear").value
        );

    if (!year) {

        year =
            currentYear();

        $("reportYear").value =
            year;
    }

    var list =
        receipts.filter(
            function(receipt) {

                return (
                    String(
                        receipt.month
                    ).startsWith(
                        String(year)
                    )
                );

            }
        );

    var rows =
        getExcelRows(list);

    var worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );

    var workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Yearly"
    );

    XLSX.writeFile(
        workbook,
        "Yearly_Collection_" +
        year +
        ".xlsx"
    );
}


/* =========================
   BACKUP
========================= */

function backupData() {

    var data =
        JSON.stringify(
            {
                members:
                    members,

                receipts:
                    receipts
            },
            null,
            2
        );

    var blob =
        new Blob(
            [data],
            {
                type:
                    "application/json"
            }
        );

    var url =
        URL.createObjectURL(
            blob
        );

    var a =
        document.createElement("a");

    a.href =
        url;

    a.download =
        "Anjuman_Gosiya_Backup_" +
        today() +
        ".json";

    a.click();

    URL.revokeObjectURL(url);
}


/* =========================
   RESTORE
========================= */

function restoreData(file) {

    if (!file) {
        return;
    }

    var reader =
        new FileReader();

    reader.onload =
        function(event) {

            try {

                var data =
                    JSON.parse(
                        event.target.result
                    );

                if (
                    !Array.isArray(
                        data.members
                    ) ||
                    !Array.isArray(
                        data.receipts
                    )
                ) {

                    throw new Error(
                        "Invalid backup"
                    );
                }

                members =
                    data.members;

                receipts =
                    data.receipts;

                saveData();

                refreshAll();

                populateMemberDropdown();

                alert(
                    "✅ Data restored successfully."
                );

            } catch (error) {

                alert(
                    "❌ Invalid backup file."
                );
            }
        };

    reader.readAsText(file);
}


/* =========================
   CLEAR DATA
========================= */

function clearAllData() {

    if (
        !confirm(
            "⚠️ Are you sure?\n\n" +
            "All members and receipts will be deleted."
        )
    ) {
        return;
    }

    if (
        !confirm(
            "Final confirmation:\n\n" +
            "Delete ALL DATA?"
        )
    ) {
        return;
    }

    members = [];

    receipts = [];

    saveData();

    refreshAll();

    populateMemberDropdown();

    alert(
        "✅ All data cleared."
    );
}


/* =========================
   REFRESH
========================= */

function refreshAll() {

    updateDashboard();

    renderMembers();
}


/* =========================
   DOM READY
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadData();

        refreshAll();

        populateMemberDropdown();


        /* HOME */

        $("homeAddMember")
            .addEventListener(
                "click",
                function() {

                    openMemberModal();

                }
            );


        $("homeNewReceipt")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "receiptPage",
                        "navReceipt"
                    );

                    prepareReceiptForm();

                }
            );


        $("homeDuplicateReceipt")
            .addEventListener(
                "click",
                function() {

                    openDuplicateModal();

                }
            );


        $("homeMonthly")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "monthlyPage",
                        ""
                    );

                }
            );


        /* NAVIGATION */

        $("navHome")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "homePage",
                        "navHome"
                    );

                }
            );


        $("navReceipt")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "receiptPage",
                        "navReceipt"
                    );

                    prepareReceiptForm();

                }
            );


        $("navMembers")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "membersPage",
                        "navMembers"
                    );

                    renderMembers();

                }
            );


        $("navSettings")
            .addEventListener(
                "click",
                function() {

                    showPage(
                        "settingsPage",
                        "navSettings"
                    );

                }
            );


        /* MEMBER */

        $("membersAdd")
            .addEventListener(
                "click",
                openMemberModal
            );


        $("receiptAddMember")
            .addEventListener(
                "click",
                openMemberModal
            );


        $("saveMember")
            .addEventListener(
                "click",
                saveMember
            );


        $("closeMember")
            .addEventListener(
                "click",
                closeMemberModal
            );


        /* RECEIPT */

        $("saveReceipt")
            .addEventListener(
                "click",
                saveReceipt
            );


        /* DUPLICATE */

        $("closeDuplicate")
            .addEventListener(
                "click",
                closeDuplicateModal
            );


        $("duplicateMember")
            .addEventListener(
                "change",
                showDuplicateReceipts
            );


        $("duplicateMonth")
            .addEventListener(
                "change",
                showDuplicateReceipts
            );


        /* REPORT */

        $("showReport")
            .addEventListener(
                "click",
                showMonthlyReport
            );


        $("monthlyExcel")
            .addEventListener(
                "click",
                exportMonthlyExcel
            );


        $("yearlyExcel")
            .addEventListener(
                "click",
                exportYearlyExcel
            );


        /* SETTINGS */

        $("backupButton")
            .addEventListener(
                "click",
                backupData
            );


        $("restoreButton")
            .addEventListener(
                "click",
                function() {

                    $("restoreFile").click();

                }
            );


        $("restoreFile")
            .addEventListener(
                "change",
                function() {

                    restoreData(
                        this.files[0]
                    );

                    this.value = "";

                }
            );


        $("clearData")
            .addEventListener(
                "click",
                clearAllData
            );

    }
);