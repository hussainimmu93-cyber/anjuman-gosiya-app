"use strict";

var KEY = "ANJUMAN_GOSIYA_APP";

var members = [];
var receipts = [];

var editingMemberId = null;
var editingReceiptId = null;


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
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

function escapeHTML(value) {

    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatMonth(month) {

    if (!month) {
        return "";
    }

    var parts = month.split("-");

    if (parts.length !== 2) {
        return month;
    }

    var year = parts[0];
    var m = Number(parts[1]);

    var names = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return names[m] + "-" + String(year).slice(-2);
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

    if (navId) {

        var nav = $(navId);

        if (nav) {
            nav.classList.add("active");
        }
    }
}


/* =========================
   MEMBER EDIT MODAL
========================= */

function ensureMemberEditModal() {

    if ($("memberEditModal")) {
        return;
    }

    var modal =
        document.createElement("div");

    modal.id = "memberEditModal";
    modal.className = "modal";

    modal.innerHTML =
        '<div class="modalBox">' +

            '<h2 id="memberEditTitle">' +
                '👤 Add Member' +
            '</h2>' +

            '<label>Member Name</label>' +

            '<input ' +
                'type="text" ' +
                'id="editMemberName" ' +
                'placeholder="Enter member name">' +

            '<label>Mobile Number</label>' +

            '<input ' +
                'type="tel" ' +
                'id="editMemberMobile" ' +
                'placeholder="10 digit mobile number" ' +
                'maxlength="10">' +

            '<button id="saveMemberEdit">' +
                '💾 Save Member' +
            '</button>' +

            '<button id="closeMemberEdit" class="secondary">' +
                'Close' +
            '</button>' +

        '</div>';

    document.body.appendChild(modal);

    $("saveMemberEdit")
        .onclick =
        saveEditedMember;

    $("closeMemberEdit")
        .onclick =
        closeMemberEditModal;
}

function openMemberModal() {

    ensureMemberEditModal();

    editingMemberId = null;

    $("memberEditTitle").textContent =
        "👤 Add Member";

    $("editMemberName").value = "";
    $("editMemberMobile").value = "";

    $("memberEditModal").style.display =
        "flex";

    $("editMemberName").focus();
}

function openEditMemberModal(id) {

    ensureMemberEditModal();

    var member =
        getMemberById(id);

    if (!member) {

        alert("Member not found.");

        return;
    }

    editingMemberId = id;

    $("memberEditTitle").textContent =
        "✏️ Edit Member";

    $("editMemberName").value =
        member.name || "";

    $("editMemberMobile").value =
        member.mobile || "";

    $("memberEditModal").style.display =
        "flex";
}

function closeMemberEditModal() {

    if ($("memberEditModal")) {

        $("memberEditModal").style.display =
            "none";
    }
}


/* =========================
   SAVE / EDIT MEMBER
========================= */

function validateMobile(
    mobile,
    currentId
) {

    if (!mobile) {
        return "";
    }

    var clean =
        mobile.replace(/\D/g, "");

    if (
        clean.length !== 10 ||
        !/^[6-9]/.test(clean)
    ) {

        alert(
            "⚠️ Please enter a valid 10-digit mobile number."
        );

        return null;
    }

    var duplicate =
        members.some(function(member) {

            if (
                currentId &&
                member.id === currentId
            ) {
                return false;
            }

            var existing =
                String(
                    member.mobile || ""
                ).replace(/\D/g, "");

            return existing === clean;
        });

    if (duplicate) {

        alert(
            "⚠️ This mobile number is already registered."
        );

        return null;
    }

    return clean;
}

function saveEditedMember() {

    var name =
        $("editMemberName")
            .value
            .trim();

    var mobile =
        $("editMemberMobile")
            .value
            .trim();

    if (!name) {

        alert(
            "Please enter member name."
        );

        return;
    }

    mobile =
        validateMobile(
            mobile,
            editingMemberId
        );

    if (mobile === null) {
        return;
    }

    if (editingMemberId) {

        var member =
            getMemberById(
                editingMemberId
            );

        if (!member) {
            return;
        }

        member.name = name;
        member.mobile = mobile;

        saveData();

        refreshAll();
        populateMemberDropdown();
        loadSingleMemberDropdown();

        closeMemberEditModal();

        alert(
            "✅ Member updated successfully."
        );

        return;
    }

    var newMember = {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 7),

        name: name,

        mobile: mobile,

        createdAt: today()
    };

    members.push(newMember);

    saveData();

    refreshAll();
    populateMemberDropdown();
    loadSingleMemberDropdown();

    closeMemberEditModal();

    alert(
        "✅ Member added successfully."
    );
}


/* =========================
   OLD MEMBER MODAL SUPPORT
========================= */

function closeMemberModal() {

    if ($("memberModal")) {

        $("memberModal").style.display =
            "none";
    }
}

function saveMember() {

    ensureMemberEditModal();

    var name =
        $("memberName")
            ? $("memberName").value.trim()
            : "";

    var mobile =
        $("memberMobile")
            ? $("memberMobile").value.trim()
            : "";

    if (!name) {

        alert(
            "Please enter member name."
        );

        return;
    }

    mobile =
        validateMobile(
            mobile,
            null
        );

    if (mobile === null) {
        return;
    }

    members.push({

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 7),

        name: name,

        mobile: mobile,

        createdAt: today()
    });

    saveData();

    refreshAll();
    populateMemberDropdown();
    loadSingleMemberDropdown();

    closeMemberModal();

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

        var receiptCount =
            receipts.filter(function(receipt) {

                return (
                    receipt.memberId ===
                    member.id
                );
            }).length;

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

            "<span class='small'>" +
            "Receipts: " +
            receiptCount +
            "</span>" +

            "<br>" +

            "<button onclick=\"openEditMemberModal('" +
            member.id +
            "')\">" +
            "✏️ Edit" +
            "</button> " +

            "<button class='danger' onclick=\"deleteMember('" +
            member.id +
            "')\">" +
            "🗑️ Delete" +
            "</button>";

        container.appendChild(row);
    });
}

function deleteMember(id) {

    var member =
        getMemberById(id);

    if (!member) {
        return;
    }

    var hasReceipt =
        receipts.some(function(receipt) {

            return receipt.memberId === id;
        });

    if (hasReceipt) {

        alert(
            "⚠️ This member has receipts.\n\n" +
            "Member cannot be deleted because doing so would affect the receipt history."
        );

        return;
    }

    if (
        !confirm(
            "Delete member \"" +
            member.name +
            "\"?"
        )
    ) {
        return;
    }

    members =
        members.filter(function(item) {

            return item.id !== id;
        });

    saveData();

    refreshAll();
    populateMemberDropdown();
    loadSingleMemberDropdown();

    alert(
        "✅ Member deleted successfully."
    );
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
                String(
                    receipt.receiptNo || ""
                ).replace(/\D/g, ""),
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
   SINGLE MEMBER DROPDOWN
========================= */

function loadSingleMemberDropdown() {

    var select =
        $("singleMemberSelect");

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">-- Select Member --</option>';

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

    editingReceiptId = null;

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

    $("saveReceipt").textContent =
        "💾 Save Receipt";

    $("receiptPreview").innerHTML =
        "";
}


/* =========================
   EDIT RECEIPT
========================= */

function editReceipt(id) {

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

    editingReceiptId = id;

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

    $("saveReceipt").textContent =
        "✏️ Update Receipt";

    renderReceiptPreview(id);

    window.scrollTo(0, 0);
}


/* =========================
   SAVE / UPDATE RECEIPT
========================= */

function saveReceipt() {

    var receiptNo =
        $("receiptNo")
            .value
            .trim();

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

    if (!amount || amount <= 0) {

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

    if (editingReceiptId) {

        var existing =
            receipts.find(function(r) {

                return r.id ===
                    editingReceiptId;
            });

        if (!existing) {

            alert(
                "❌ Receipt not found."
            );

            return;
        }

        existing.receiptNo =
            receiptNo;

        existing.date =
            date;

        existing.memberId =
            memberId;

        existing.amount =
            amount;

        existing.month =
            month;

        existing.mode =
            mode;

        existing.signature =
            "Aadilshah Hussain";

        saveData();

        refreshAll();

        renderReceiptPreview(
            existing.id
        );

        $("saveReceipt").textContent =
            "✏️ Update Receipt";

        alert(
            "✅ Receipt updated successfully.\n\n" +
            "Receipt No. " +
            existing.receiptNo +
            " remains the same."
        );

        return;
    }

    var duplicateNo =
        receipts.some(function(receipt) {

            return String(
                receipt.receiptNo
            ).trim() === receiptNo;
        });

    if (duplicateNo) {

        alert(
            "⚠️ This Receipt No. already exists.\n\n" +
            "Use Edit Receipt to update an existing receipt."
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

    return members.find(function(member) {

        return member.id === id;
    });
}


/* =========================
   RECEIPT PREVIEW
========================= */

function renderReceiptPreview(id) {

    var receipt =
        receipts.find(function(r) {

            return r.id === id;
        });

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
                        escapeHTML(receipt.receiptNo) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Date</td>' +
                    '<td>' +
                        escapeHTML(receipt.date) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Member Name</td>' +
                    '<td>' +
                        escapeHTML(member.name) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Mobile</td>' +
                    '<td>' +
                        escapeHTML(member.mobile || "") +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>For Month</td>' +
                    '<td>' +
                        escapeHTML(
                            formatMonth(
                                receipt.month
                            )
                        ) +
                    '</td>' +
                '</tr>' +

                '<tr>' +
                    '<td>Payment Mode</td>' +
                    '<td>' +
                        escapeHTML(receipt.mode) +
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

            '<button onclick="editReceipt(\'' +
                receipt.id +
            '\')">' +
                '✏️ Edit Receipt' +
            '</button>' +

            '<button class="whatsapp" ' +
                'onclick="shareReceiptPDF(\'' +
                receipt.id +
            '\')">' +
                '📲 WhatsApp PDF' +
            '</button>' +

            '<button onclick="downloadReceiptPDF(\'' +
                receipt.id +
            '\')">' +
                '📥 Save PDF' +
            '</button>' +

        '</div>';
}


/* =========================
   DUPLICATE / VIEW RECEIPT
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

function showDuplicateReceipts() {

    var memberId =
        $("duplicateMember").value;

    var month =
        $("duplicateMonth").value;

    var list =
        $("duplicateReceiptList");

    list.innerHTML =
        "";

    if (!memberId || !month) {
        return;
    }

    var found =
        receipts.filter(function(receipt) {

            return (
                receipt.memberId === memberId &&
                receipt.month === month
            );
        });

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
            escapeHTML(receipt.receiptNo) +
            "</strong>" +

            "<br>" +

            "<span class='small'>" +
            "Date: " +
            escapeHTML(receipt.date) +
            " | Amount: " +
            money(receipt.amount) +
            " | Mode: " +
            escapeHTML(receipt.mode) +
            "</span>" +

            "<br><br>" +

            "<button onclick=\"viewDuplicateReceipt('" +
            receipt.id +
            "')\">" +
            "👁️ View Receipt" +
            "</button>" +

            "<button onclick=\"editReceipt('" +
            receipt.id +
            "')\">" +
            "✏️ Edit" +
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

    editingReceiptId =
        receipt.id;

    $("saveReceipt").textContent =
        "✏️ Update Receipt";

    renderReceiptPreview(
        receipt.id
    );

    window.scrollTo(0, 0);
}

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

    editingReceiptId =
        receipt.id;

    renderReceiptPreview(
        receipt.id
    );

    setTimeout(function() {

        shareReceiptPDF(
            receipt.id
        );

    }, 500);
}


/* =========================
   RECEIPT PDF
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
            await createReceiptPDF(id);

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

        renderReceiptPreview(id);

        var pdf =
            await createReceiptPDF(id);

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

                files: [file]
            });

        } else {

            pdf.save(
                "Receipt-" +
                receipt.receiptNo +
                ".pdf"
            );

            alert(
                "📥 PDF save ho gaya.\n\n" +
                "Ab WhatsApp par attach karke bhej sakte hain."
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
                    receipt.month ===
                    month
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
   REPORT DATA
========================= */

function getReceiptForMemberMonth(
    memberId,
    month
) {

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
        return null;
    }

    found.sort(
        function(a, b) {

            return String(a.id)
                .localeCompare(
                    String(b.id)
                );
        }
    );

    return found[
        found.length - 1
    ];
}

function getYearMonths(year) {

    var result = [];

    for (
        var i = 1;
        i <= 12;
        i++
    ) {

        result.push(
            year +
            "-" +
            String(i).padStart(2, "0")
        );
    }

    return result;
}


/* =========================
   SHOW MONTHLY REPORT
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

    var totalPaid = 0;
    var paidCount = 0;
    var unpaidCount = 0;

    var html =

        "<h3>" +
        "Monthly Report - " +
        escapeHTML(
            formatMonth(month)
        ) +
        "</h3>" +

        "<table class='reportTable'>" +

        "<tr>" +
        "<th>Member</th>" +
        "<th>Mobile</th>" +
        "<th>Status</th>" +
        "<th>Receipt No.</th>" +
        "<th>Amount</th>" +
        "<th>Payment Mode</th>" +
        "</tr>";

    members.forEach(function(member) {

        var receipt =
            getReceiptForMemberMonth(
                member.id,
                month
            );

        if (receipt) {

            paidCount++;

            totalPaid +=
                Number(
                    receipt.amount || 0
                );

            html +=

                "<tr>" +

                "<td>" +
                escapeHTML(member.name) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    member.mobile || ""
                ) +
                "</td>" +

                "<td>Paid</td>" +

                "<td>" +
                escapeHTML(
                    receipt.receiptNo
                ) +
                "</td>" +

                "<td>" +
                money(receipt.amount) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    receipt.mode
                ) +
                "</td>" +

                "</tr>";

        } else {

            unpaidCount++;

            html +=

                "<tr>" +

                "<td>" +
                escapeHTML(member.name) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    member.mobile || ""
                ) +
                "</td>" +

                "<td>Unpaid</td>" +

                "<td></td>" +

                "<td>₹0.00</td>" +

                "<td></td>" +

                "</tr>";
        }
    });

    html += "</table>";

    html +=

        "<div class='totalBox'>" +

        "Paid Members: " +
        paidCount +

        " | Unpaid Members: " +
        unpaidCount +

        "<br>" +

        "Total Paid Amount: " +
        money(totalPaid) +

        "</div>";

    $("monthlyReport").innerHTML =
        html;
}


/* =========================
   PDF TABLE
========================= */

function drawPDFTable(
    pdf,
    headers,
    rows,
    startY
) {

    var pageWidth =
        pdf.internal.pageSize.getWidth();

    var pageHeight =
        pdf.internal.pageSize.getHeight();

    var margin = 7;

    var available =
        pageWidth -
        (margin * 2);

    var colWidth =
        available /
        headers.length;

    var rowHeight = 9;

    var y = startY;

    pdf.setFontSize(7);

    function drawHeader() {

        pdf.setFillColor(
            7,
            94,
            84
        );

        pdf.setTextColor(
            255,
            255,
            255
        );

        headers.forEach(
            function(header, i) {

                pdf.rect(
                    margin +
                    i * colWidth,
                    y,
                    colWidth,
                    rowHeight,
                    "F"
                );

                pdf.text(
                    String(header),
                    margin +
                    i * colWidth +
                    1,
                    y + 5
                );
            }
        );

        pdf.setTextColor(
            0,
            0,
            0
        );

        y += rowHeight;
    }

    drawHeader();

    rows.forEach(function(row) {

        if (
            y >
            pageHeight - 15
        ) {

            pdf.addPage();

            y = 10;

            drawHeader();
        }

        row.forEach(
            function(cell, i) {

                pdf.rect(
                    margin +
                    i * colWidth,
                    y,
                    colWidth,
                    rowHeight
                );

                var text =
                    String(
                        cell == null
                            ? ""
                            : cell
                    );

                if (
                    text.length > 18
                ) {

                    text =
                        text.substring(
                            0,
                            17
                        ) +
                        "…";
                }

                pdf.text(
                    text,
                    margin +
                    i * colWidth +
                    1,
                    y + 5
                );
            }
        );

        y += rowHeight;
    });
}


/* =========================
   MONTH-WISE PDF
========================= */

async function createMonthWisePDF() {

    var month =
        $("monthlyMonth").value;

    if (!month) {

        alert(
            "Please select month."
        );

        return;
    }

    var rows = [];

    var totalPaid = 0;
    var paidCount = 0;
    var unpaidCount = 0;

    members.forEach(function(member) {

        var receipt =
            getReceiptForMemberMonth(
                member.id,
                month
            );

        if (receipt) {

            paidCount++;

            totalPaid +=
                Number(
                    receipt.amount || 0
                );

            rows.push([
                member.name,
                member.mobile || "",
                formatMonth(month),
                "Paid",
                receipt.receiptNo,
                money(receipt.amount),
                receipt.mode
            ]);

        } else {

            unpaidCount++;

            rows.push([
                member.name,
                member.mobile || "",
                formatMonth(month),
                "Unpaid",
                "",
                "₹0.00",
                ""
            ]);
        }
    });

    var jsPDF =
        window.jspdf.jsPDF;

    var pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    pdf.setFontSize(16);

    pdf.text(
        "अंजुमन गौसिया तालीमुल कुराण",
        105,
        15,
        {
            align: "center"
        }
    );

    pdf.setFontSize(10);

    pdf.text(
        "PTR No.: 10418-95 (पुणे)",
        105,
        22,
        {
            align: "center"
        }
    );

    pdf.text(
        "Monthly Paid / Unpaid Report - " +
        formatMonth(month),
        105,
        30,
        {
            align: "center"
        }
    );

    drawPDFTable(
        pdf,
        [
            "Member",
            "Mobile",
            "Month",
            "Status",
            "Receipt No.",
            "Amount",
            "Mode"
        ],
        rows,
        38
    );

    pdf.setFontSize(10);

    pdf.text(
        "Paid Members: " +
        paidCount,
        10,
        285
    );

    pdf.text(
        "Unpaid Members: " +
        unpaidCount,
        70,
        285
    );

    pdf.text(
        "Total Paid: " +
        money(totalPaid),
        140,
        285
    );

    pdf.save(
        "Monthly_Report_" +
        month +
        ".pdf"
    );
}


/* =========================
   MEMBER-WISE PDF
   WORKING VERSION
========================= */

async function createMemberWisePDF() {

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

    var months =
        getYearMonths(year);

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

    async function makeMemberPage(member) {

        var paidMonths = 0;
        var unpaidMonths = 0;
        var totalAmount = 0;

        var rowsHTML = "";

        months.forEach(function(month) {

            var receipt =
                getReceiptForMemberMonth(
                    member.id,
                    month
                );

            if (receipt) {

                paidMonths++;

                totalAmount +=
                    Number(
                        receipt.amount || 0
                    );

                rowsHTML +=
                    '<tr>' +
                    '<td>' +
                    escapeHTML(
                        formatMonth(month)
                    ) +
                    '</td>' +
                    '<td><b>Paid</b></td>' +
                    '<td>' +
                    escapeHTML(
                        receipt.receiptNo || ""
                    ) +
                    '</td>' +
                    '<td>' +
                    escapeHTML(
                        money(
                            Number(
                                receipt.amount || 0
                            )
                        )
                    ) +
                    '</td>' +
                    '</tr>';

            } else {

                unpaidMonths++;

                rowsHTML +=
                    '<tr>' +
                    '<td>' +
                    escapeHTML(
                        formatMonth(month)
                    ) +
                    '</td>' +
                    '<td><b>Unpaid</b></td>' +
                    '<td></td>' +
                    '<td>—</td>' +
                    '</tr>';
            }
        });

        var report =
            document.createElement("div");

        report.style.position =
            "fixed";

        report.style.left =
            "-10000px";

        report.style.top =
            "0";

        report.style.width =
            "760px";

        report.style.background =
            "#ffffff";

        report.style.color =
            "#111111";

        report.style.padding =
            "28px";

        report.style.boxSizing =
            "border-box";

        report.style.fontFamily =
            'Arial, "Noto Sans Devanagari", sans-serif';

        report.innerHTML =

            '<div style="text-align:center;">' +

                '<div style="' +
                    'font-size:24px;' +
                    'font-weight:bold;' +
                    'margin-bottom:6px;' +
                '">' +
                    'अंजुमन गौसिया तालीमुल कुराण' +
                '</div>' +

                '<div style="font-size:14px;">' +
                    'PTR No.: 10418-95 (पुणे)' +
                '</div>' +

                '<div style="font-size:13px;margin-top:3px;">' +
                    '42, कोरेगांव पार्क, गाडगे महाराज वस्ती, पुणे – 1' +
                '</div>' +

                '<div style="' +
                    'font-size:19px;' +
                    'font-weight:bold;' +
                    'margin-top:18px;' +
                    'margin-bottom:18px;' +
                '">' +
                    'Member-wise Paid / Unpaid Report - ' +
                    year +
                '</div>' +

            '</div>' +

            '<div style="' +
                'border:1px solid #333;' +
                'padding:15px;' +
                'margin-bottom:15px;' +
            '">' +

                '<div style="' +
                    'font-size:19px;' +
                    'font-weight:bold;' +
                    'margin-bottom:6px;' +
                '">' +
                    'Member: ' +
                    escapeHTML(
                        member.name || ""
                    ) +
                '</div>' +

                '<div style="font-size:14px;">' +
                    'Mobile: ' +
                    escapeHTML(
                        member.mobile || ""
                    ) +
                '</div>' +

            '</div>' +

            '<table style="' +
                'width:100%;' +
                'border-collapse:collapse;' +
                'font-size:13px;' +
            '">' +

                '<thead>' +
                    '<tr>' +

                        '<th style="' +
                            'border:1px solid #333;' +
                            'padding:8px;' +
                            'text-align:left;' +
                        '">' +
                            'Month' +
                        '</th>' +

                        '<th style="' +
                            'border:1px solid #333;' +
                            'padding:8px;' +
                            'text-align:left;' +
                        '">' +
                            'Status' +
                        '</th>' +

                        '<th style="' +
                            'border:1px solid #333;' +
                            'padding:8px;' +
                            'text-align:left;' +
                        '">' +
                            'Receipt No.' +
                        '</th>' +

                        '<th style="' +
                            'border:1px solid #333;' +
                            'padding:8px;' +
                            'text-align:right;' +
                        '">' +
                            'Amount' +
                        '</th>' +

                    '</tr>' +
                '</thead>' +

                '<tbody>' +
                    rowsHTML +
                '</tbody>' +

            '</table>' +

            '<div style="' +
                'border:1px solid #333;' +
                'margin-top:18px;' +
                'padding:12px;' +
                'font-size:14px;' +
            '">' +

                '<b>Paid Months:</b> ' +
                paidMonths +

                '&nbsp;&nbsp;&nbsp;&nbsp;' +

                '<b>Unpaid Months:</b> ' +
                unpaidMonths +

                '<br><br>' +

                '<b>Total Paid Amount:</b> ' +
                escapeHTML(
                    money(totalAmount)
                ) +

            '</div>';

        document.body.appendChild(
            report
        );

        try {

            await new Promise(
                function(resolve) {

                    setTimeout(
                        resolve,
                        300
                    );
                }
            );

            var canvas =
                await html2canvas(
                    report,
                    {
                        scale: 2,
                        useCORS: true,
                        backgroundColor:
                            "#ffffff",
                        logging: false
                    }
                );

            var imgData =
                canvas.toDataURL(
                    "image/png"
                );

            var imgWidth =
                pageWidth -
                (margin * 2);

            var imgHeight =
                canvas.height *
                imgWidth /
                canvas.width;

            return {
                imgData:
                    imgData,

                imgWidth:
                    imgWidth,

                imgHeight:
                    imgHeight
            };

        } finally {

            document.body.removeChild(
                report
            );
        }
    }

    if (!members.length) {

        var emptyPage =
            document.createElement("div");

        emptyPage.style.position =
            "fixed";

        emptyPage.style.left =
            "-10000px";

        emptyPage.style.top =
            "0";

        emptyPage.style.width =
            "760px";

        emptyPage.style.background =
            "#ffffff";

        emptyPage.style.padding =
            "30px";

        emptyPage.style.boxSizing =
            "border-box";

        emptyPage.style.fontFamily =
            'Arial, "Noto Sans Devanagari", sans-serif';

        emptyPage.innerHTML =
            '<div style="text-align:center;">' +

                '<div style="' +
                    'font-size:24px;' +
                    'font-weight:bold;' +
                '">' +
                    'अंजुमन गौसिया तालीमुल कुराण' +
                '</div>' +

                '<div style="margin-top:20px;font-size:18px;">' +
                    'No members found.' +
                '</div>' +

            '</div>';

        document.body.appendChild(
            emptyPage
        );

        try {

            var emptyCanvas =
                await html2canvas(
                    emptyPage,
                    {
                        scale: 2,
                        backgroundColor:
                            "#ffffff"
                    }
                );

            var emptyData =
                emptyCanvas.toDataURL(
                    "image/png"
                );

            var emptyWidth =
                pageWidth -
                (margin * 2);

            var emptyHeight =
                emptyCanvas.height *
                emptyWidth /
                emptyCanvas.width;

            pdf.addImage(
                emptyData,
                "PNG",
                margin,
                margin,
                emptyWidth,
                emptyHeight
            );

        } finally {

            document.body.removeChild(
                emptyPage
            );
        }

    } else {

        for (
            var i = 0;
            i < members.length;
            i++
        ) {

            if (i > 0) {
                pdf.addPage();
            }

            var result =
                await makeMemberPage(
                    members[i]
                );

            var maxHeight =
                pageHeight -
                (margin * 2);

            var finalHeight =
                Math.min(
                    result.imgHeight,
                    maxHeight
                );

            var finalWidth =
                result.imgWidth;

            if (
                result.imgHeight >
                maxHeight
            ) {

                finalHeight =
                    maxHeight;

                finalWidth =
                    result.imgWidth *
                    (
                        maxHeight /
                        result.imgHeight
                    );
            }

            var x =
                (
                    pageWidth -
                    finalWidth
                ) / 2;

            pdf.addImage(
                result.imgData,
                "PNG",
                x,
                margin,
                finalWidth,
                finalHeight
            );
        }
    }

    var totalPages =
        pdf.internal.getNumberOfPages();

    for (
        var p = 1;
        p <= totalPages;
        p++
    ) {

        pdf.setPage(p);

        pdf.setFontSize(8);

        pdf.text(
            "Page " +
            p +
            " of " +
            totalPages,
            pageWidth / 2,
            pageHeight - 4,
            {
                align: "center"
            }
        );
    }

    pdf.save(
        "Member_Wise_Report_" +
        year +
        ".pdf"
    );
}


/* =========================
   SINGLE MEMBER EXCEL
========================= */

function createSingleMemberExcel() {

    var select =
        $("singleMemberSelect");

    if (!select) {
        return;
    }

    var memberId =
        select.value;

    if (!memberId) {

        alert(
            "⚠️ Please select a member."
        );

        return;
    }

    var member =
        members.find(function(m) {

            return String(m.id) ===
                String(memberId);
        });

    if (!member) {

        alert(
            "⚠️ Member not found."
        );

        return;
    }

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

    var months =
        getYearMonths(year);

    var data = [];

    var paidMonths = 0;
    var unpaidMonths = 0;
    var totalAmount = 0;

    months.forEach(function(month) {

        var receipt =
            getReceiptForMemberMonth(
                member.id,
                month
            );

        if (receipt) {

            paidMonths++;

            var amount =
                Number(
                    receipt.amount || 0
                );

            totalAmount +=
                amount;

            data.push({

                "Member":
                    member.name,

                "Mobile":
                    member.mobile || "",

                "Month":
                    formatMonth(month),

                "Status":
                    "Paid",

                "Receipt No.":
                    receipt.receiptNo || "",

                "Amount":
                    amount,

                "Payment Mode":
                    receipt.mode || "",

                "Receipt Date":
                    receipt.date || ""
            });

        } else {

            unpaidMonths++;

            data.push({

                "Member":
                    member.name,

                "Mobile":
                    member.mobile || "",

                "Month":
                    formatMonth(month),

                "Status":
                    "Unpaid",

                "Receipt No.":
                    "",

                "Amount":
                    "",

                "Payment Mode":
                    "",

                "Receipt Date":
                    ""
            });
        }
    });

    data.push({});

    data.push({

        "Member":
            "SUMMARY",

        "Mobile":
            "",

        "Month":
            "",

        "Status":
            "Paid Months: " +
            paidMonths,

        "Receipt No.":
            "Unpaid Months: " +
            unpaidMonths,

        "Amount":
            totalAmount,

        "Payment Mode":
            "",

        "Receipt Date":
            ""
    });

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "❌ Excel library load nahi hui."
        );

        return;
    }

    var worksheet =
        XLSX.utils.json_to_sheet(
            data
        );

    var workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Member Report"
    );

    worksheet["!cols"] = [

        { wch: 22 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 14 },
        { wch: 16 },
        { wch: 15 }
    ];

    XLSX.writeFile(
        workbook,
        "Single_Member_Report_" +
        member.name.replace(
            /[^a-zA-Z0-9]/g,
            "_"
        ) +
        "_" +
        year +
        ".xlsx"
    );
}


/* =========================
   SINGLE MEMBER PDF
========================= */

async function createSingleMemberPDF() {

    var select =
        $("singleMemberSelect");

    if (!select) {
        return;
    }

    var memberId =
        select.value;

    if (!memberId) {

        alert(
            "⚠️ Please select a member."
        );

        return;
    }

    var member =
        members.find(function(m) {

            return String(m.id) ===
                String(memberId);
        });

    if (!member) {

        alert(
            "⚠️ Member not found."
        );

        return;
    }

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

    var months =
        getYearMonths(year);

    var paidMonths = 0;
    var unpaidMonths = 0;
    var totalAmount = 0;

    var rowsHTML = "";

    months.forEach(function(month) {

        var receipt =
            getReceiptForMemberMonth(
                member.id,
                month
            );

        if (receipt) {

            paidMonths++;

            totalAmount +=
                Number(
                    receipt.amount || 0
                );

            rowsHTML +=

                '<tr>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                        escapeHTML(
                            formatMonth(month)
                        ) +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                        '<b>Paid</b>' +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                        escapeHTML(
                            receipt.receiptNo || ""
                        ) +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:right;' +
                    '">' +
                        escapeHTML(
                            money(
                                Number(
                                    receipt.amount || 0
                                )
                            )
                        ) +
                    '</td>' +

                '</tr>';

        } else {

            unpaidMonths++;

            rowsHTML +=

                '<tr>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                        escapeHTML(
                            formatMonth(month)
                        ) +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                        '<b>Unpaid</b>' +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                    '">' +
                    '</td>' +

                    '<td style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:right;' +
                    '">' +
                        '—' +
                    '</td>' +

                '</tr>';
        }
    });

    var report =
        document.createElement("div");

    report.style.position =
        "fixed";

    report.style.left =
        "-10000px";

    report.style.top =
        "0";

    report.style.width =
        "760px";

    report.style.background =
        "#ffffff";

    report.style.color =
        "#111111";

    report.style.padding =
        "28px";

    report.style.boxSizing =
        "border-box";

    report.style.fontFamily =
        'Arial, "Noto Sans Devanagari", sans-serif';

    report.innerHTML =

        '<div style="text-align:center;">' +

            '<div style="' +
                'font-size:24px;' +
                'font-weight:bold;' +
                'margin-bottom:6px;' +
            '">' +
                'अंजुमन गौसिया तालीमुल कुराण' +
            '</div>' +

            '<div style="font-size:14px;">' +
                'PTR No.: 10418-95 (पुणे)' +
            '</div>' +

            '<div style="font-size:13px;margin-top:3px;">' +
                '42, कोरेगांव पार्क, गाडगे महाराज वस्ती, पुणे – 1' +
            '</div>' +

            '<div style="' +
                'font-size:19px;' +
                'font-weight:bold;' +
                'margin-top:18px;' +
                'margin-bottom:18px;' +
            '">' +
                'Single Member Paid / Unpaid Report - ' +
                year +
            '</div>' +

        '</div>' +

        '<div style="' +
            'border:1px solid #333;' +
            'padding:15px;' +
            'margin-bottom:15px;' +
        '">' +

            '<div style="' +
                'font-size:19px;' +
                'font-weight:bold;' +
                'margin-bottom:6px;' +
            '">' +

                'Member: ' +

                escapeHTML(
                    member.name || ""
                ) +

            '</div>' +

            '<div style="font-size:14px;">' +

                'Mobile: ' +

                escapeHTML(
                    member.mobile || ""
                ) +

            '</div>' +

        '</div>' +

        '<table style="' +
            'width:100%;' +
            'border-collapse:collapse;' +
            'font-size:13px;' +
        '">' +

            '<thead>' +

                '<tr>' +

                    '<th style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:left;' +
                    '">' +
                        'Month' +
                    '</th>' +

                    '<th style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:left;' +
                    '">' +
                        'Status' +
                    '</th>' +

                    '<th style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:left;' +
                    '">' +
                        'Receipt No.' +
                    '</th>' +

                    '<th style="' +
                        'border:1px solid #333;' +
                        'padding:8px;' +
                        'text-align:right;' +
                    '">' +
                        'Amount' +
                    '</th>' +

                '</tr>' +

            '</thead>' +

            '<tbody>' +
                rowsHTML +
            '</tbody>' +

        '</table>' +

        '<div style="' +
            'border:1px solid #333;' +
            'margin-top:18px;' +
            'padding:12px;' +
            'font-size:14px;' +
        '">' +

            '<b>Paid Months:</b> ' +
            paidMonths +

            '&nbsp;&nbsp;&nbsp;&nbsp;' +

            '<b>Unpaid Months:</b> ' +
            unpaidMonths +

            '<br><br>' +

            '<b>Total Paid Amount:</b> ' +

            escapeHTML(
                money(totalAmount)
            ) +

        '</div>';

    document.body.appendChild(
        report
    );

    try {

        await new Promise(
            function(resolve) {

                setTimeout(
                    resolve,
                    300
                );
            }
        );

        var canvas =
            await html2canvas(
                report,
                {
                    scale: 2,
                    useCORS: true,
                    backgroundColor:
                        "#ffffff",
                    logging: false
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

        var maxHeight =
            pageHeight -
            (margin * 2);

        if (
            imageHeight >
            maxHeight
        ) {

            imageHeight =
                maxHeight;

            imageWidth =
                canvas.width *
                (
                    maxHeight /
                    canvas.height
                );
        }

        var x =
            (
                pageWidth -
                imageWidth
            ) / 2;

        pdf.addImage(
            imageData,
            "PNG",
            x,
            margin,
            imageWidth,
            imageHeight
        );

        pdf.setFontSize(8);

        pdf.text(
            "Single Member Report",
            pageWidth / 2,
            pageHeight - 4,
            {
                align: "center"
            }
        );

        pdf.save(
            "Single_Member_Report_" +
            member.name.replace(
                /[^a-zA-Z0-9]/g,
                "_"
            ) +
            "_" +
            year +
            ".pdf"
        );

    } finally {

        document.body.removeChild(
            report
        );
    }
}


/* =========================
   EXCEL MONTH-WISE
========================= */

function exportMonthlyExcel() {

    var month =
        $("monthlyMonth").value;

    if (!month) {

        alert(
            "Please select month."
        );

        return;
    }

    var rows = [];

    var total = 0;

    members.forEach(function(member) {

        var receipt =
            getReceiptForMemberMonth(
                member.id,
                month
            );

        if (receipt) {

            total +=
                Number(
                    receipt.amount || 0
                );

            rows.push({

                "Member Name":
                    member.name,

                "Mobile":
                    member.mobile || "",

                "Month":
                    formatMonth(month),

                "Status":
                    "Paid",

                "Receipt No.":
                    receipt.receiptNo,

                "Amount":
                    Number(
                        receipt.amount || 0
                    ),

                "Payment Mode":
                    receipt.mode,

                "Receipt Date":
                    receipt.date

            });

        } else {

            rows.push({

                "Member Name":
                    member.name,

                "Mobile":
                    member.mobile || "",

                "Month":
                    formatMonth(month),

                "Status":
                    "Unpaid",

                "Receipt No.":
                    "",

                "Amount":
                    0,

                "Payment Mode":
                    "",

                "Receipt Date":
                    ""

            });
        }
    });

    rows.push({});

    rows.push({

        "Member Name":
            "TOTAL PAID AMOUNT",

        "Amount":
            total
    });

    downloadExcel(
        rows,
        "Month_Wise_" + month,
        "Month-Wise"
    );
}


/* =========================
   EXCEL MEMBER-WISE
========================= */

function exportMemberWiseExcel() {

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

    var months =
        getYearMonths(year);

    var rows = [];

    members.forEach(function(member) {

        var row = {

            "Member Name":
                member.name,

            "Mobile":
                member.mobile || ""
        };

        var paidMonths = 0;
        var unpaidMonths = 0;
        var totalAmount = 0;

        months.forEach(function(month) {

            var receipt =
                getReceiptForMemberMonth(
                    member.id,
                    month
                );

            var label =
                formatMonth(month);

            if (receipt) {

                paidMonths++;

                totalAmount +=
                    Number(
                        receipt.amount || 0
                    );

                row[label + " Status"] =
                    "Paid";

                row[label + " Receipt No."] =
                    receipt.receiptNo;

                row[label + " Amount"] =
                    Number(
                        receipt.amount || 0
                    );

            } else {

                unpaidMonths++;

                row[label + " Status"] =
                    "Unpaid";

                row[label + " Receipt No."] =
                    "";

                row[label + " Amount"] =
                    0;
            }
        });

        row["Paid Months"] =
            paidMonths;

        row["Unpaid Months"] =
            unpaidMonths;

        row["Total Paid Amount"] =
            totalAmount;

        rows.push(row);
    });

    downloadExcel(
        rows,
        "Member_Wise_" + year,
        "Member-Wise"
    );
}


/* =========================
   GENERIC EXCEL
========================= */

function downloadExcel(
    rows,
    filename,
    sheetName
) {

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "❌ Excel library load nahi hui."
        );

        return;
    }

    var worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );

    var workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName
    );

    XLSX.writeFile(
        workbook,
        filename + ".xlsx"
    );
}


/* =========================
   YEARLY EXCEL
========================= */

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

                return String(
                    receipt.month || ""
                ).startsWith(
                    String(year)
                );
            }
        );

    var rows =
        list.map(function(receipt) {

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
                    formatMonth(
                        receipt.month
                    ),

                "Amount":
                    Number(
                        receipt.amount || 0
                    ),

                "Payment Mode":
                    receipt.mode,

                "Signature":
                    "Aadilshah Hussain"
            };
        });

    downloadExcel(
        rows,
        "Yearly_Collection_" + year,
        "Yearly"
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
        URL.createObjectURL(blob);

    var a =
        document.createElement("a");

    a.href =
        url;

    a.download =
        "Anjuman_Gosiya_Backup_" +
        today() +
        ".json";

    a.click();

    URL.revokeObjectURL(
        url
    );
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

                loadSingleMemberDropdown();

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
   CLEAR ALL DATA
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

    loadSingleMemberDropdown();

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

        ensureMemberEditModal();

        refreshAll();

        populateMemberDropdown();

        loadSingleMemberDropdown();


        /* =====================
           HOME
        ===================== */

        if ($("homeAddMember")) {

            $("homeAddMember")
                .addEventListener(
                    "click",
                    openMemberModal
                );
        }

        if ($("homeNewReceipt")) {

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
        }

        if ($("homeDuplicateReceipt")) {

            $("homeDuplicateReceipt")
                .addEventListener(
                    "click",
                    openDuplicateModal
                );
        }

        if ($("homeViewReceipt")) {

            $("homeViewReceipt")
                .addEventListener(
                    "click",
                    openDuplicateModal
                );
        }

        if ($("homeMonthly")) {

            $("homeMonthly")
                .addEventListener(
                    "click",
                    function() {

                        showPage(
                            "monthlyPage",
                            ""
                        );

                        if ($("monthlyMonth")) {

                            $("monthlyMonth").value =
                                currentMonth();
                        }

                        if ($("reportYear")) {

                            $("reportYear").value =
                                currentYear();
                        }

                        loadSingleMemberDropdown();
                    }
                );
        }


        /* =====================
           NAVIGATION
        ===================== */

        if ($("navHome")) {

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
        }

        if ($("navReceipt")) {

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
        }

        if ($("navMembers")) {

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
        }

        if ($("navSettings")) {

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
        }


        /* =====================
           MEMBER
        ===================== */

        if ($("membersAdd")) {

            $("membersAdd")
                .addEventListener(
                    "click",
                    openMemberModal
                );
        }

        if ($("receiptAddMember")) {

            $("receiptAddMember")
                .addEventListener(
                    "click",
                    openMemberModal
                );
        }

        if ($("saveMember")) {

            $("saveMember")
                .addEventListener(
                    "click",
                    saveMember
                );
        }

        if ($("closeMember")) {

            $("closeMember")
                .addEventListener(
                    "click",
                    closeMemberModal
                );
        }


        /* =====================
           RECEIPT
        ===================== */

        if ($("saveReceipt")) {

            $("saveReceipt")
                .addEventListener(
                    "click",
                    saveReceipt
                );
        }


        /* =====================
           DUPLICATE
        ===================== */

        if ($("closeDuplicate")) {

            $("closeDuplicate")
                .addEventListener(
                    "click",
                    closeDuplicateModal
                );
        }

        if ($("duplicateMember")) {

            $("duplicateMember")
                .addEventListener(
                    "change",
                    showDuplicateReceipts
                );
        }

        if ($("duplicateMonth")) {

            $("duplicateMonth")
                .addEventListener(
                    "change",
                    showDuplicateReceipts
                );
        }


        /* =====================
           REPORT BUTTONS
        ===================== */

        if ($("monthlyPDFMonthWise")) {

            $("monthlyPDFMonthWise")
                .addEventListener(
                    "click",
                    createMonthWisePDF
                );
        }

        if ($("monthlyPDFMemberWise")) {

            $("monthlyPDFMemberWise")
                .addEventListener(
                    "click",
                    createMemberWisePDF
                );
        }

        if ($("singleMemberPDF")) {

            $("singleMemberPDF")
                .addEventListener(
                    "click",
                    createSingleMemberPDF
                );
        }

        if ($("singleMemberExcel")) {

            $("singleMemberExcel")
                .addEventListener(
                    "click",
                    createSingleMemberExcel
                );
        }

        if ($("monthlyExcelMonthWise")) {

            $("monthlyExcelMonthWise")
                .addEventListener(
                    "click",
                    exportMonthlyExcel
                );
        }

        if ($("monthlyExcelMemberWise")) {

            $("monthlyExcelMemberWise")
                .addEventListener(
                    "click",
                    exportMemberWiseExcel
                );
        }

        if ($("yearlyExcel")) {

            $("yearlyExcel")
                .addEventListener(
                    "click",
                    exportYearlyExcel
                );
        }


        /* =====================
           SETTINGS
        ===================== */

        if ($("backupButton")) {

            $("backupButton")
                .addEventListener(
                    "click",
                    backupData
                );
        }

        if ($("restoreButton")) {

            $("restoreButton")
                .addEventListener(
                    "click",
                    function() {

                        $("restoreFile").click();
                    }
                );
        }

        if ($("restoreFile")) {

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
        }

        if ($("clearData")) {

            $("clearData")
                .addEventListener(
                    "click",
                    clearAllData
                );
        }


        /* =====================
           DEFAULT REPORT YEAR
        ===================== */

        if ($("monthlyMonth")) {

            $("monthlyMonth").value =
                currentMonth();
        }

        if ($("reportYear")) {

            $("reportYear").value =
                currentYear();
        }

        loadSingleMemberDropdown();

    }
);