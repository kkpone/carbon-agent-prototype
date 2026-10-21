const seatInput = document.getElementById('seat-count');
const monthInput = document.getElementById('month-count');
const errorNode = document.getElementById('form-error');
const confirmation = document.getElementById('confirmation');
const clampSeats = value => Math.min(10000, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));
const clampMonths = value => Math.min(36, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));
const formatYuan = value => `¥${value.toLocaleString('zh-CN')}`;

function updateSummary() {
  const seats = clampSeats(Number(seatInput.value));
  const months = clampMonths(Number(monthInput.value));
  document.getElementById('summary-seats').textContent = `${seats} 席`;
  document.getElementById('summary-months').textContent = `${months} 个月`;
  document.getElementById('summary-monthly').textContent = formatYuan(seats * 88);
  document.getElementById('summary-total').textContent = formatYuan(seats * months * 88);
}

function setSeats(value) {
  seatInput.value = clampSeats(Number(value));
  updateSummary();
}

function setMonths(value) {
  monthInput.value = clampMonths(Number(value));
  updateSummary();
}

document.getElementById('seat-minus').addEventListener('click', () => setSeats(Number(seatInput.value) - 1));
document.getElementById('seat-plus').addEventListener('click', () => setSeats(Number(seatInput.value) + 1));
seatInput.addEventListener('input', updateSummary);
seatInput.addEventListener('change', () => setSeats(Number(seatInput.value)));
document.getElementById('month-minus').addEventListener('click', () => setMonths(Number(monthInput.value) - 1));
document.getElementById('month-plus').addEventListener('click', () => setMonths(Number(monthInput.value) + 1));
monthInput.addEventListener('input', updateSummary);
monthInput.addEventListener('change', () => setMonths(Number(monthInput.value)));

function showError(message, focusElement) {
  errorNode.textContent = message;
  errorNode.hidden = false;
  focusElement?.focus();
}

document.getElementById('confirm-config').addEventListener('click', () => {
  errorNode.hidden = true;
  const company = document.getElementById('company-name');
  const acknowledge = document.getElementById('acknowledge');
  if (!Number.isInteger(Number(seatInput.value)) || Number(seatInput.value) < 1 || Number(seatInput.value) > 10000) return showError('席位数量须为 1 至 10,000 的整数。', seatInput);
  if (!Number.isInteger(Number(monthInput.value)) || Number(monthInput.value) < 1 || Number(monthInput.value) > 36) return showError('购买时长须为 1 至 36 个月的整数。', monthInput);
  if (!company.value.trim()) return showError('请填写企业名称。', company);
  if (!acknowledge.checked) return showError('请先确认演示配置说明。', acknowledge);
  updateSummary();
  confirmation.hidden = false;
  document.getElementById('management-link').focus();
});

document.addEventListener('keydown', event => {
  if (confirmation.hidden) return;
  if (event.key === 'Tab') {
    const managementLink = document.getElementById('management-link');
    const returnLink = document.getElementById('confirmation-return');
    if (event.shiftKey && document.activeElement === managementLink) { event.preventDefault(); returnLink.focus(); }
    else if (!event.shiftKey && document.activeElement === returnLink) { event.preventDefault(); managementLink.focus(); }
  }
});
updateSummary();
