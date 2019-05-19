
function setToSheet () {
	//各月のBSを取得
	let monthlyFs = fiscalMonth.map(month => getItemArray(month));

	//BSの配列を３次元→２次元に削減
	let list = monthlyFs.reduce((prev, post) => {
		prev.push(...post);
		return prev;
	});

	//シートに転記
	let bsSheet = ss.getSheetByName('BS');
	bsSheet.getRange(2, 1, list.length, list[0].length).setValues(list);
	
}


/**
 *取引先情報の有無（仮払・仮受消費税は取引先持っていない）と、
 *合計勘定か否かにより抽出分岐をかける
 * @param {number} month
 * @returns {array} 科目の配列
 */
function getItemArray (month: number) {
	//合計勘定=Falseなら個別科目のデータを、
	//Trueならカテゴリデータを返す
	let data = getBs(month).map(account => {
		if(account.partners){
			let arr = account.partners.map(partner => {
				return [
					currentYear,
					month,
					account.account_item_id,
					account.account_item_name,
					partner.name,
					partner.opening_balance,
					partner.debit_amount,
					partner.credit_amount,
					partner.closing_balance
				];
			});

			return arr

	//仮払・仮受消費税
	}else if (!account.total_line) {
		return [[
			currentYear,
			month,
			account.account_item_id,
			account.account_item_name,
			null,
			account.opening_balance,
			account.debit_amount,
			account.credit_amount,
			account.closing_balance
		]];
	
	//合計勘定の場合
	}else{
		return [[
			currentYear,
			month,
			account.account_category_id,
			account.account_category_name,
			"合計勘定",
			account.opening_balance,
			account.debit_amount,
			account.credit_amount,
			account.closing_balance
		]];
	}
});

let reduced = data.map((prev, post) => {
	prev.push(...post);
	return prev;
})

return reduced;

}


/**
 *
 *
 * @param {number} month
 * @returns {object} resBs
 */
function getBs (month: number) {
	//トークン取得
	const freeApp = getService();
	const accessToken = freeApp.getAccessToken();

	//取得情報のパラメータ指定
	let keyUrl = 'https://api.freee.co.jp/api/1/';
	let targetItem = 'reports/trial_bs?';
	let companyId = 'company_id=' + comId;
	let fiscalYear = '&fiscal_year' + currentYear;
	let startMonth = '&start_month' + month;
	let endMonth = '&end_month=' + month;
	let breakdown = '&breakdown_display_type=' + 'partner';

	//url結合
	let url
		= `keyUrl${targetItem}${companyId}${fiscalYear}${startMonth}${endMonth}${breakdown}`;
		
	//option, headers
	let options = {
		'method': 'get',
		'headers': {
			'Authorization': 'Bearer ' + accessToken
		} 
	};

	//取得したデータをJsonParseしてバランスの部分だけ取得
	let res = UrlFetchApp.fetch(url, options).getContentText();
	res = JSON.parse(res);
	let resBs = res.trial_bs.balances;

	return resBs;

}
