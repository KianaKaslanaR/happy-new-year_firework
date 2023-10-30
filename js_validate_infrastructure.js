/**
 * Brower compatible JS validator infrastructure
 */
function JsValidator(formName) {
	SmpAssert.notNull(formName, "formName is null");

	var form = document.getElementById(formName);

	function checkForm() {
		var formCheckSpanList = getFormCheckSpanByForm(form);
		return internalCheckForm(formCheckSpanList);
	}
	
	function internalCheckForm(formCheckSpanList) {
		SmpAssert.notNull(formCheckSpanList, "formCheckSpanList is null");
		
		var validatorList = createValidatorList(formCheckSpanList);
		for ( var i = 0; i < validatorList.length; i++) {
			var validate = validatorList[i];
			if (false == validate.validate()) {
				return false;
			}
		}

		return true;
	}
	
	function checkSpecifiedField(fieldNames) {
		SmpAssert.notEmpty(fieldNames, "fieldNames is empty");
		
		var spans = getSpansByFieldNames(fieldNames);
		
		var formCheckSpanList = getFormCheckSpanByName(spans);
		return internalCheckForm(formCheckSpanList);
	}
	
	function getSpansByFieldNames(spanNames) {
		SmpAssert.notEmpty(spanNames, "spanNames is empty");
		
		var spanNameMap = new Object();
		for(var i = 0; i < spanNames.length; i++) {
			var spanName = spanNames[i];
			spanNameMap[spanName] = new Object();
		}
		
		var spans = form.getElementsByTagName("span");
		var result = [];
		for(var i = 0; i < spans.length; i++) {
			var span = spans[i];
			var id = span.id;
			if ("formCheckSpan" != id) {
				continue;
			}
			
			var formCheckSpan = new FormCheckSpan(span, form);
			var fieldName = formCheckSpan.getFieldName();
			if(spanNameMap[fieldName] != undefined) {
				result.push(span);
			}
		}
		
		return result;
	}

	function createValidatorList(formCheckSpanList) {
		SmpAssert.notNull(formCheckSpanList, "formCheckSpanList is null");

		var validatorList = [];
		for ( var i = 0; i < formCheckSpanList.length; i++) {
			var span = formCheckSpanList[i];
			var validator = span.createValidator();
			validatorList.push(validator);
		}

		return validatorList;
	}

	function getFormCheckSpanByForm(form) {
		var spans = form.getElementsByTagName("span");
		return getFormCheckSpanByName(spans);
	}
	
	function getFormCheckSpanByName(spans) {
		var resultArray = [];
		for ( var i = 0; i < spans.length; i++) {
			var span = spans[i];
			var id = span.id;
			if ("formCheckSpan" == id) {
				var formCheckSpan = new FormCheckSpan(span, form);
				resultArray.push(formCheckSpan);
			}
		}

		return resultArray;
	}

	this.checkForm = checkForm;
	this.checkSpecifiedField = checkSpecifiedField;

};

function FormCheckSpan(spanParam, formParam) {
	SmpAssert.notNull(spanParam, "spanParam is null");
	SmpAssert.equals(spanParam.id, "formCheckSpan", spanParam.id
			+ " is not formCheckSpan");

	var span = spanParam;
	var form = formParam;

	function getFieldName() {
		var fieldName = internalGetAttributeValue("field");
		SmpAssert.notNull(fieldName, "fieldName is null");
		return fieldName;
	}

	function getField() {
		var fieldName = getFieldName();
		var field = form.elements[fieldName];
		SmpAssert.notNull(field, "cannot find field for name[" + fieldName
				+ "]");

		return field;
	}

	function isMayBeHidden() {
		var mayBeHidden = internalGetAttributeValue("mayBeHidden");
		if (null == mayBeHidden) {
			return false;
		}

		return new Boolean(mayBeHidden);
	}

	function isRequired() {
		var innerText = span.innerText;
		if (null == innerText || "" == innerText) {
			innerText = span.textContent;
		}

		return innerText == "*";
	}

	function isTrimElementValue() {
		var notTrim = internalGetAttributeValue("notTrim");
		if ("true" == notTrim) {
			return false;
		}

		return true;
	}

	function isCheckLengthRange() {
		if (false == internalHasAttribute("minlength")) {
			return false;
		}

		if (false == internalHasAttribute("maxlength")) {
			return false;
		}

		return true;
	}
	
	function isCheckFixLength() {
		var minlength = internalGetAttributeValue("minlength");
		var maxlength = internalGetAttributeValue("maxlength");
		
		if(minlength == maxlength) {
			return true;
		}
		
		return false;
	}
	
	function isCheckIntRange() {
		if (false == internalHasAttribute("minIntValue")) {
			return false;
		}

		if (false == internalHasAttribute("maxIntValue")) {
			return false;
		}

		return true;
	}

	function isCheckMaxLength() {
		if (false == internalHasAttribute("maxlength")) {
			return false;
		}

		return true;
	}

	function isSpecialValidate() {
		if (false == internalHasAttribute("validateNames")) {
			return false;
		}

		return true;
	}
	
	function hasCustomJs() {
		if (false == internalHasAttribute("customJs")) {
			return false;
		}

		return true;
	}

	function trimElementValue() {
		var value = getFieldValue();
		var newValue = trim(value);
		setFieldValue(newValue);
	}
	
	function getFieldValue() {
		var field = getField();
		return field.value;
	}
	
	function setFieldValue(newValue) {
		var field = getField();
		field.value = newValue;
	}
	
	function isDisableOrHidden() {
		var obj = getField();
		if(obj.disabled) {
			return true;
		}
		
		if(isHidden(obj)) {
			return true;
		}
		
		return false;
	}

	function isHidden() {
		var parent = getField();
		while(true) {
			if(parent == null) {
				return false;
			}
			
			var style = parent.style; 
			if(parent.style == null) {
				return false;
			}
			
			var display = style.display;
			if("none" == display) {
				return true;
			}
			
			parent = parent.parentNode;
		}
	}
	
	function isDefaultValue(){
		var defaultValue =internalGetAttributeValue("defaultValue");
		if(defaultValue == null)
		{
			return false;
		}
		return defaultValue == getFieldValue();
	}

	function createValidator() {
		if (isTrimElementValue()) {
			trimElementValue();
		}

		var validatorHolder = new ValidatorHolder();
		if(isMayBeHidden() && isDisableOrHidden()) {
			return validatorHolder;
		} 
		addNotBlankValidator(validatorHolder,this);
		if(isDefaultValue())
		{
			return validatorHolder;
		}
		addLengthRangeValidator(validatorHolder,this);
		addIntRangeValidator(validatorHolder,this);
		addCustomValidator(validatorHolder,this);
		addSpecialValidator(validatorHolder,this);
		addForbiddenCharValidator(validatorHolder,this);

		return validatorHolder;
	}

	function addNotBlankValidator(validatorHolder,object) {
		if (isRequired()) {
			var notNullValidator = ValidatorFactory.create("notBlank", object);
			validatorHolder.add(notNullValidator);
		}
	}

	function addLengthRangeValidator(validatorHolder,object) {
		if (isCheckLengthRange()) {
			if(isCheckFixLength()) {
				var fixLengthValidator = ValidatorFactory.create("fixLength",
						object);
				validatorHolder.add(fixLengthValidator);
			} else {
				var lengthRangeValidator = ValidatorFactory.create("lengthRange",
						object);
				validatorHolder.add(lengthRangeValidator);
			}
		} else {
			if (isCheckMaxLength()) {
				var maxLengthValidator = ValidatorFactory.create("maxLength",
						object);
				validatorHolder.add(maxLengthValidator);
			}
		}
	}
	
	function addIntRangeValidator(validatorHolder,object) {
		if (isCheckIntRange()) {
			var intRangeValidator = ValidatorFactory.create("intRange",
					object);
			validatorHolder.add(intRangeValidator);
		} 
	}

	function addSpecialValidator(validatorHolder,object) {
		if (isSpecialValidate()) {
			var validateNames = internalGetAttributeValue("validateNames");
			var namesArray = validateNames.split(";")
			for ( var i = 0; i < namesArray.length; i++) {
				if (trim(namesArray[i]).length == 0) {
					continue;
				}
				validatorHolder.add(ValidatorFactory
						.create(namesArray[i], object));
			}
		}
	}
	
	function addCustomValidator(validatorHolder,object) {
		if (hasCustomJs()) {
			var customJs = internalGetAttributeValue("customJs");
			validatorHolder.add(ValidatorFactory
					.createCustomValidator(customJs, object));
		}
	}

	function addForbiddenCharValidator(validatorHolder,object) {
		var forbiddenCharValidator = ValidatorFactory.create("forbiddenChar",
				object);
		validatorHolder.add(forbiddenCharValidator);
	}

	function internalGetAttributeValue(attrName) {
		SmpAssert.notNull(attrName, "attrName is null");

		var attr = internalGetAttributeNode(attrName);
		if (attr == null) {
			return null;
		}

		return attr.nodeValue;
	}
	
	function internalGetAttributeNode(attrName) {
		SmpAssert.notNull(attrName, "attrName is null");

		var attr = span.attributes[attrName];
		return attr;
	}

	function internalHasAttribute(attrName) {
		SmpAssert.notNull(attrName, "attrName is null");
		var attr = span.attributes[attrName];
		if (null == attr) {
			return false;
		}

		return true;
	}

	function getLabelName() {
		var labelName = internalGetAttributeValue("title");
		SmpAssert.notNull(labelName, "title attr is null for span["
				+ getFieldName() + "]");
		return labelName;
	}

	function getMinLength() {
		var minlength = internalGetAttributeValue("minlength");
		return parseInt(minlength);
	}

	function getMaxLength() {
		var maxlength = internalGetAttributeValue("maxlength");
		return parseInt(maxlength);
	}
	
	function getMinIntValue() {
		var minIntValue = internalGetAttributeValue("minIntValue");
		return parseInt(minIntValue);
	}

	function getMaxIntValue() {
		var maxIntValue = internalGetAttributeValue("maxIntValue");
		return parseInt(maxIntValue);
	}

	this.createValidator = createValidator;
	this.getLabelName = getLabelName;
	this.getField = getField;
	this.getMaxLength = getMaxLength;
	this.getMinLength = getMinLength;
	this.getMinIntValue = getMinIntValue;
	this.getMaxIntValue = getMaxIntValue;
	this.isRequired = isRequired;
	this.getFieldName = getFieldName;
	this.setFieldValue = setFieldValue;
	this.getFieldValue = getFieldValue;
};

var SmpAssert = new function() {
	this.notNull = function(objParam, errMsg) {
		if (null == objParam) {
			alert(errMsg)
			throw errMsg;
		}
	}

	this.equals = function(leftParam, rightParam, errMsg) {
		if (leftParam != rightParam) {
			alert(errMsg)
			throw errMsg;
		}
	}
	
	this.notEmpty = function(objParam, errMsg) {
		if(null == objParam) {
			alert(errMsg)
			throw errMsg;
		}
		
		if(objParam.length == undefined) {
			alert(errMsg)
			throw errMsg;
		}
		
		if(objParam.length == 0) {
			alert(errMsg)
			throw errMsg;
		}
	}
};

var ValidatorFactory = new function() {
	var preDefinedValidatorMap = new Object();

	preDefinedValidatorMap.notBlank = NotBlankSubValidator;
	preDefinedValidatorMap.lengthRange = LengthRangeValidator;
	preDefinedValidatorMap.maxLength = MaxLengthValidator;
	preDefinedValidatorMap.forbiddenChar = ForbiddenCharValidator;
	preDefinedValidatorMap.number = NumberValidator;
	preDefinedValidatorMap.commonChar = CommonCharValidator;
	preDefinedValidatorMap.intRange = IntRangeValidator;
	preDefinedValidatorMap.ip = IpValidator;
	preDefinedValidatorMap.fixLength = FixLengthValidator;
	preDefinedValidatorMap.domainName = DomainNameValidator

	function create(name, spanParam) {
		SmpAssert.notNull(name, "name is null");
		var validator = preDefinedValidatorMap[name];
		return new validator(spanParam);
	}

	function NotBlankSubValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();

			if (isBlank(element,elementValue)) {
				var labelName = span.getLabelName();

				var i18nMsg = "{0}不能为空!";
				var errorMessage = i18nMsg.replace("{0}", labelName);
				alert(errorMessage);
				span.setFieldValue(elementValue);
				element.focus();
				return false;
			}

			return true;
		}

		function isBlank(element,elementValue) {
			
			if(element.className == 'input_style_gray'){
				return true;
			}
			
			if (elementValue == null) {
				return true;
			}

			var value = trim(elementValue);
			if (value.length == 0) {
				return true;
			}

			return false;
		}

		this.validate = validate;
	}

	function LengthRangeValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			var minLength = span.getMinLength();
			var maxLength = span.getMaxLength();
			var labelName = span.getLabelName();

			if (false == checkLength(elementValue, minLength, maxLength)) {
				var i18nMsg = "{labelName}长度为{minLength}到{maxLength}个字符!";
				var errorMsg = i18nMsg;
				errorMsg = errorMsg.replace("{labelName}", labelName);
				errorMsg = errorMsg.replace("{minLength}", minLength);
				errorMsg = errorMsg.replace("{maxLength}", maxLength);
				alert(errorMsg);
				element.focus();
				return false;
			}

			return true;
		}

		function checkLength(str, minLength, maxLength) {
			var length = countLength(str);
			if (length < minLength) {
				return false;
			}

			if (length > maxLength) {
				return false;
			}

			return true;
		}

		this.validate = validate;
	}
	
	function FixLengthValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			var minLength = span.getMinLength();
			var labelName = span.getLabelName();

			if (false == checkFixLength(elementValue, minLength)) {
				var i18nMsg = "{labelName}长度必须为{minLength}个字符!";
				var errorMsg = i18nMsg;
				errorMsg = errorMsg.replace("{labelName}", labelName);
				errorMsg = errorMsg.replace("{minLength}", minLength);
				alert(errorMsg);
				element.focus();
				return false;
			}

			return true;
		}

		function checkFixLength(str, minLength) {
			var length = countLength(str);
			if (length == minLength) {
				return true;
			}
			
			return false;
		}

		this.validate = validate;
	};

	function MaxLengthValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			var maxLength = span.getMaxLength();
			var labelName = span.getLabelName();

			if (false == checkLength(elementValue, maxLength)) {
				var zhLen = Math.floor(maxLength / 2);

				var i18nMsg = "{labelName}的最大长度为{maxLength}个英文字符或者{zhLen}个中文字符!";
				var errorMsg = i18nMsg;
				errorMsg = errorMsg.replace("{labelName}", labelName);
				errorMsg = errorMsg.replace("{maxLength}", maxLength);
				errorMsg = errorMsg.replace("{zhLen}", zhLen);
				alert(errorMsg);

				element.focus();
				return false;
			}

			return true;
		}

		function checkLength(str, maxLength) {
			var length = countLength(str);
			if (length > maxLength) {
				return false;
			}

			return true;
		}

		this.validate = validate;
	}
	
	function IntRangeValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			var minIntValue = span.getMinIntValue();
			var maxIntValue = span.getMaxIntValue();
			var labelName = span.getLabelName();

			if (false == checkIntRange(elementValue, minIntValue, maxIntValue)) {
				var i18nMsg = "{labelName}只能为正整数,且只能位于[{minIntValue},{maxIntValue}]之间!";
				var errorMsg = i18nMsg;
				errorMsg = errorMsg.replace("{labelName}", labelName);
				errorMsg = errorMsg.replace("{minIntValue}", minIntValue);
				errorMsg = errorMsg.replace("{maxIntValue}", maxIntValue);
				alert(errorMsg);
				element.focus();
				return false;
			}

			return true;
		}

		function checkIntRange(value, minValue, maxValue) {
			 if(value==null||Trim(value)==""){
				    return true;
			 }
			 var testValue = Trim(value);
			  if(/\D/.exec(testValue)){
			    return false;
			  } 
			  if (!isValidIntegerForm(testValue)) {
				return false ;	  	
			  }
			  
			  if((minValue != null) && (parseInt(testValue) < parseInt(minValue))){
			  	return false;
			  }
			  
			  if((maxValue!=null) && (parseInt(testValue) > parseInt(maxValue))){
			  	return false;
			  }    
			  return true;	
		}
		this.validate = validate;
	}

	function NumberValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			if (isNumber(elementValue)) {
				var labelName = span.getLabelName();

				var i18nMsg = "{0}只能包含数字!";
				var errorMessage = i18nMsg.replace("{0}", labelName);
				alert(errorMessage);
				span.setFieldValue(trim(elementValue));
				element.focus();
				return false;
			}
			return true;
		}

		function isNumber(elementValue) {
			return /\D/.exec(elementValue);
		}

		this.validate = validate;
	}
	
	function IpValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			if (false == checkIp(elementValue)) {
				var labelName = span.getLabelName();

				var i18nMsg = "{0}不是有效的IP地址!";
				var errorMessage = i18nMsg.replace("{0}", labelName);
				alert(errorMessage);
				span.setFieldValue(trim(elementValue));
				element.focus();
				return false;
			}
			return true;
		}

		function checkIp(ip) {
			if(ip==null||ip==""){
		       return true;
			}
		    if (ip.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) != -1) {
		        var myArray = ip.split(/\./);
		        if (myArray[0] > 255 || myArray[1] > 255 || myArray[2] > 255 || myArray[3] > 255)
		            return false;
		        if (myArray[0] == 0 && myArray[1] == 0 && myArray[2] == 0 && myArray[3] == 0 ||
		            myArray[0] == 255 && myArray[1] == 255 && myArray[2] == 255 && myArray[3] == 255)
		            return false;
		        return true;
		    }
		    else
		        return false;
		}

		this.validate = validate;
	}
	
	function DomainNameValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			if (false == checkDomainName(elementValue)) {
				var labelName = span.getLabelName();

				var i18nMsg = "{0}不是合法的域名格式!";
				var errorMessage = i18nMsg.replace("{0}", labelName);
				alert(errorMessage);
				span.setFieldValue(trim(elementValue));
				element.focus();
				return false;
			}
			return true;
		}

		function checkDomainName(value) {
			if(value==null||value==""){
		       return true;
			}
			var result = /[^0-9a-zA-Z\.\-]+/.exec(value);
			
			if(result)
			{
				return false;
			}
			
			if(value == ".")
			{
				return false;
			}
					
			var arrays = value.split("\.");
					
			if(arrays.length < 2)
			{
				return false;
			}
			for(var i=0; i < arrays.length; i++)
			{
				var subDns = arrays[i];
				if(subDns == "")
				{
					return false;
				}
			}
			return true;
		}

		this.validate = validate;
	}
	
	function isValidIntegerForm(testInt) {
		if (testInt == null || testInt == '') {
			return true ;
		}
		
		var pattern = /^[1-9][0-9]*$/ ;
		var testValue = Trim(testInt) ;

		var r = pattern.exec(testValue) ;
		
		if (r) {
			return true ;
		} else if (testValue == '0') {
			return true ;
		}

		return false ;
	}
	
	function CommonCharValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			if (false == span.isRequired() && elementValue.length == 0) {
				return true;
			}
			if (isCommonChar(elementValue)) {
				var labelName = span.getLabelName();

				var i18nMsg = "{0}只能为字母, 数字以及常用英文符号!";
				var errorMessage = i18nMsg.replace("{0}", labelName);
				alert(errorMessage);
				element.focus();
				return false;
			}
			return true;
		}

		function isCommonChar(elementValue) {
			if(elementValue == null || elementValue == ''){
				return true;
			}
			var result = /[^ 0-9a-zA-Z~!@#$%^&*()_+`\-=\[\]\\\{\}\|;\":\'<>?,./]+/.exec(elementValue);
			return result;
		}

		this.validate = validate;
	}

	function ForbiddenCharValidator(spanParam) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		var span = spanParam;

		function validate() {
			var element = span.getField();
			var elementValue = span.getFieldValue();
			var labelName = span.getLabelName();

			if (false == ForbiddenCharCodeUtils.checkForbiddenCharCode(labelName, elementValue)) {
				element.focus();
				return false;
			}

			return true;
		}

		this.validate = validate;
	}

	function countLength(str) {
		var ch;
		var length = 0;
		for (i = 0; i < str.length; i++) {

			ch = str.substring(i, i + 1);
			if (/[\u4E00-\u9FA5]/.test(ch) || /[^\x00-\xff]/.test(ch)) {
				length = length + 2;
			} else {
				length = length + 1;
			}
		}
		return length;
	}
	
	function CustomValidator(spanParam, customJs) {
		SmpAssert.notNull(spanParam, "spanParam is null");
		SmpAssert.notNull(customJs, "customJs is null");
		
		var span = spanParam;
		var customJs = customJs;

		function validate() {
			if (false == eval(customJs)) {
				var element = span.getField();
				element.focus();
				return false;
			}

			return true;
		}

		this.validate = validate;
	}
	
	function createCustomValidator(customJs, object) {
		return new CustomValidator(object, customJs)
	}
	
	
	this.create = create;
	this.createCustomValidator = createCustomValidator;
};

function ValidatorHolder() {
	var subValidatorList = [];

	function add(subValidator) {
		SmpAssert.notNull(subValidator, "subValidator is null");
		subValidatorList.push(subValidator);
	}

	function validate() {
		for ( var i = 0; i < subValidatorList.length; i++) {
			var subValidator = subValidatorList[i];
			var result = subValidator.validate();
			if (false == result) {
				return false;
			}
		}
	}

	this.add = add;
	this.validate = validate;
};

/**
 * 用于全局校验非法字符的JS方法，因为代码中多处需要这个功能，所以抽取公共方法
 */
var ForbiddenCharCodeUtils = new function() {
	var PATTERN = /^([\t\r\n]|[\u0020-\u007E]|[\u2014\u2018\u2019\u201C\u201D\u2030\u2026]|[\u3000-\u3002\u300A\u300B\u3010\u3011\u3016\u3017]|[\uFF00-\uFF5F\uFFE5]|[\u4E00-\u9FFF])*$/;
	var SPLIT = ", ";
	
	function checkForbiddenCharCode(labelName, value) {
		if (value == "") {
			return true;
		}
		
		var invalidCharArray = getInvalidCharArray(value);
		if (invalidCharArray.length == 0) {
			return true;
		}
		
		var invalidCharString = convertArrayToString(invalidCharArray, SPLIT);
		var errorMsg = createErrorMsg(labelName, invalidCharString);
		alert(errorMsg);
		return false;
	}
	
	function getInvalidCharArray(value) {
		var invalidCharArray = [];
		for (var i = 0; i < value.length; i++) {
			var ch = value.charAt(i);
			if (false == PATTERN.test(ch)) {
				invalidCharArray.push(ch);
			}
		}
		
		return invalidCharArray;
	}
	
	function convertArrayToString(invalidCharArray, split) {
		var result = "";
		for (var i = 0; i < invalidCharArray.length; i++) {
			var ch = invalidCharArray[i];
			if (result != "") {
				result += split;
			}
			result += ch;
		}
		
		return result;
	}
	
	function createErrorMsg(labelName, invalidCharString) {
		var i18nMsg = "{0}存在系统不支持的特殊字符(特殊字符为：{1})!";
		
		var errorMsg = i18nMsg;
		errorMsg = errorMsg.replace("{0}", labelName);
		errorMsg = errorMsg.replace("{1}", invalidCharString);
		
		return errorMsg;
	}
	
	this.checkForbiddenCharCode = checkForbiddenCharCode;
};