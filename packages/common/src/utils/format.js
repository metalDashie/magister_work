"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrice = formatPrice;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
function formatPrice(amount, currency = 'UAH') {
    const formatter = new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency,
    });
    return formatter.format(amount);
}
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('uk-UA').format(d);
}
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('uk-UA', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(d);
}
//# sourceMappingURL=format.js.map